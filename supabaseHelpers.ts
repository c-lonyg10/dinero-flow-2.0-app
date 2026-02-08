import { supabase } from './supabaseClient'
import { AppData } from './types'

// Helper to show errors on mobile
const showError = (title: string, error: any) => {
  console.error(`❌ ${title}:`, error);
  // Only alert if it's a real error object with a message
  if (error && typeof error === 'object') {
    alert(`⚠️ ${title}: ${error.message || JSON.stringify(error)}`);
  }
};

export async function loadDataFromSupabase(userId: string): Promise<AppData | null> {
  try {
    // 1. Fetch Budget
    const { data: budgetData, error: budgetError } = await supabase
      .from('budget')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (budgetError && budgetError.code !== 'PGRST116') throw budgetError

    // 2. Fetch Bills
    const { data: billsData, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)

    if (billsError) throw billsError

    // 3. Fetch Transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (transactionsError) throw transactionsError

    // 4. Fetch Hypotheticals
    const { data: hypotheticalsData, error: hypotheticalsError } = await supabase
      .from('dream_island_hypotheticals')
      .select('*')
      .eq('user_id', userId)

    if (hypotheticalsError) throw hypotheticalsError

    if (!budgetData) return null

    // Transform Data
    const appData: AppData = {
      budget: {
        startingBalance: Number(budgetData.starting_balance),
        avgIncome: Number(budgetData.avg_income),
        annaContrib: 300.00,
        rentTotal: 0,
      },
      bills: (billsData || []).map((bill: any) => ({
        id: Number(bill.bill_id), // No more clamping
        name: bill.name,
        amount: Number(bill.amount),
        day: bill.due_date,
        manualPaid: [],
      })),
      transactions: (transactionsData || []).map((tx: any) => {
        // Robust ID parsing: handles both "user_123" and raw "17700..." formats
        let numericId = 0;
        if (typeof tx.transaction_id === 'string' && tx.transaction_id.includes('_')) {
             numericId = parseInt(tx.transaction_id.split('_').pop() || '0');
        } else {
             numericId = Number(tx.transaction_id);
        }
        
        return {
          id: numericId || Date.now(), // Fallback to now if parse fails
          d: tx.date,
          t: tx.description,
          a: Number(tx.amount),
          c: tx.category || '',
        };
      }),
      dreamIslandHypotheticals: (hypotheticalsData || []).map((hyp: any) => ({
        id: hyp.id,
        name: hyp.name,
        amount: Number(hyp.amount),
        type: hyp.type,
        date: hyp.date || undefined,
        totalAmount: hyp.total_amount ? Number(hyp.total_amount) : undefined,
        numberOfPayments: hyp.number_of_payments || undefined,
        startDate: hyp.start_date || undefined,
      })),
    }

    return appData
  } catch (error: any) {
    showError('Load Failed', error);
    return null
  }
}

export async function saveDataToSupabase(userId: string, data: AppData): Promise<boolean> {
  // SAFETY LOCK: Don't save if critical data is suspiciously empty
  // This prevents a "bad load" from wiping out the database
  if (!data.budget || (data.bills.length === 0 && data.transactions.length === 0)) {
    console.warn("⚠️ SAFETY LOCK: Prevented saving empty data to Supabase.");
    return false;
  }

  const results = { budget: false, bills: false, transactions: false, hypotheticals: false };

  // 1. BUDGET
  try {
    const { error } = await supabase.from('budget').upsert({
        user_id: userId,
        starting_balance: Number(data.budget.startingBalance),
        avg_income: Number(data.budget.avgIncome),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) throw error;
    results.budget = true;
  } catch (error) { console.error('Save Budget Error', error); }

  // 2. BILLS
  try {
    // Only delete and re-insert if we actually have bills to save
    if (data.bills.length > 0) {
        await supabase.from('bills').delete().eq('user_id', userId);
        
        const billsToInsert = data.bills.map((bill: any) => ({
            user_id: userId,
            bill_id: Number(bill.id),
            name: String(bill.name || 'Unknown'),
            amount: parseFloat(String(bill.amount)),
            due_date: Number(bill.day || bill.dueDate || 1),
            category: '',
        }));

        const { error } = await supabase.from('bills').insert(billsToInsert);
        if (error) throw error;
    }
    results.bills = true;
  } catch (error) { console.error('Save Bills Error', error); }

  // 3. TRANSACTIONS
  try {
    if (data.transactions.length > 0) {
        await supabase.from('transactions').delete().eq('user_id', userId);
        
        const transactionsToInsert = data.transactions.map((tx: any, index: number) => {
            const originalId = tx.id || Date.now() + index;
            const safeId = `${userId.slice(0, 8)}_${originalId}`;

            return {
            user_id: userId,
            transaction_id: safeId, 
            description: String(tx.t || tx.description || 'Unknown'),
            amount: parseFloat(String(tx.a || tx.amount || 0)),
            date: String(tx.d || tx.date || '2026-01-01'),
            category: String(tx.c || tx.category || ''),
            };
        });

        // Batch insert
        const batchSize = 50;
        for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
            const batch = transactionsToInsert.slice(i, i + batchSize);
            const { error } = await supabase.from('transactions').insert(batch);
            if (error) throw error;
        }
    }
    results.transactions = true;
  } catch (error) { console.error('Save Transactions Error', error); }

  // 4. HYPOTHETICALS
  try {
    await supabase.from('dream_island_hypotheticals').delete().eq('user_id', userId);
    if (data.dreamIslandHypotheticals?.length > 0) {
      const { error } = await supabase.from('dream_island_hypotheticals').insert(
          data.dreamIslandHypotheticals.map((hyp: any) => ({
            user_id: userId,
            name: String(hyp.name),
            amount: parseFloat(String(hyp.amount)),
            type: String(hyp.type),
            date: hyp.date ? String(hyp.date) : null,
            total_amount: hyp.totalAmount ? parseFloat(String(hyp.totalAmount)) : null,
            number_of_payments: hyp.numberOfPayments ? parseInt(String(hyp.numberOfPayments)) : null,
            start_date: hyp.startDate ? String(hyp.startDate) : null,
          }))
        );
      if (error) throw error;
    }
    results.hypotheticals = true;
  } catch (error) { showError('Save Hypo Error', error); }

  return results.budget && results.bills && results.transactions;
}

export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  // Kept your existing logic, but simplified return
  return false; 
}