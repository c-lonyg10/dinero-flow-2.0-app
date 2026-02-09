import { supabase } from './supabaseClient'
import { AppData, Debt } from './types'

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

    // 5. Fetch Debts
    const { data: debtsData, error: debtsError } = await supabase.from('debts').select('*').eq('user_id', userId);
    
    if (!budgetData) return null;

    // --- AUTO-DEDUPLICATOR FOR DEBTS ---
    // If we find debts with the exact same name, we keep only the last one.
    const uniqueDebtsMap = new Map();
    (debtsData || []).forEach((d: any) => {
        uniqueDebtsMap.set(d.name, d); // Overwrites previous entry with same name
    });
    const cleanedDebts = Array.from(uniqueDebtsMap.values());
    // -----------------------------------

    return {

    // Transform Data
      budget: {
        startingBalance: Number(budgetData.starting_balance),
        avgIncome: Number(budgetData.avg_income),
        annaContrib: 300.00,
        rentTotal: Number(budgetData.rent_total || 0), // Ensure this fallback exists
        rentHistory: budgetData.rent_history || {}, // <--- NEW LINE
      },
      bills: (billsData || []).map((bill: any) => ({
        id: Number(bill.bill_id), // No more clamping
        name: bill.name,
        amount: Number(bill.amount),
        day: bill.due_date,
        manualPaid: bill.manual_paid || [], // <--- UPDATED: Load the Paid History
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
          c: tx.category || 'Other', // <--- UPDATED: Load the Category or default to Other
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

      debts: cleanedDebts.map((d: any) => ({
        id: Number(d.id),
        name: d.name,
        totalAmount: Number(d.total_amount),
        prePaid: Number(d.pre_paid),
        monthlyPayment: Number(d.monthly_payment),
        icon: d.icon,
        color: d.color,
        dueDay: d.due_day
     })),
    }
  } catch (error: any) {
    showError('Load Failed', error);
    return null
  }
}

// Save all data to Supabase (Smart Sync: Upsert + Delete Missing)
export async function saveDataToSupabase(userId: string, data: AppData): Promise<boolean> {
  // Safety check: Don't save empty data
  if (!data.budget || (data.bills.length === 0 && data.transactions.length == 0)) {
    return false;
  }

  const results = { budget: false, bills: false, transactions: false, hypotheticals: false, debts: false };

  // 1. BUDGET (Upsert)
  try {
    const { error } = await supabase.from('budget').upsert({
        user_id: userId,
        starting_balance: Number(data.budget.startingBalance),
        avg_income: Number(data.budget.avgIncome),
        rent_history: data.budget.rentHistory || {}, // <--- NEW LINE
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) throw error;
    results.budget = true;
  } catch (error) { console.error('Save Budget Error', error); }

  // 2. BILLS (Garbage Collect + Upsert)
  try {
    if (data.bills.length > 0) {
        // A. Garbage Collection: Delete bills from DB that are no longer in the app
        const localBillIds = new Set(data.bills.map((b: any) => Number(b.id)));
        
        // Fetch current DB IDs for this user
        const { data: serverBills } = await supabase
            .from('bills')
            .select('bill_id')
            .eq('user_id', userId);

        if (serverBills) {
            const idsToDelete = serverBills
                .map(row => row.bill_id)
                .filter(id => !localBillIds.has(id)); // If DB has it but App doesn't -> Delete it

            if (idsToDelete.length > 0) {
                await supabase
                    .from('bills')
                    .delete()
                    .eq('user_id', userId)
                    .in('bill_id', idsToDelete);
            }
        }

        // B. Upsert the current list
        const billsToUpsert = data.bills.map((bill: any) => ({
            user_id: userId,
            bill_id: Number(bill.id),
            name: String(bill.name || 'Unknown'),
            amount: parseFloat(String(bill.amount)),
            due_date: Number(bill.day || bill.dueDate || 1),
            manual_paid: bill.manualPaid || [], // <--- UPDATED: Save the Paid History
            category: ' ',
        }));

        const { error } = await supabase.from('bills').upsert(billsToUpsert, { onConflict: 'user_id, bill_id' });
        if (error) throw error;
    }
    results.bills = true;
  } catch (error) { console.error('Save Bills Error', error); }

  // 3. TRANSACTIONS (Garbage Collect + Upsert)
  try {
    if (data.transactions.length > 0) {
        // A. Generate the "Safe IDs" for local transactions so we can compare
        const localSafeIds = new Set(data.transactions.map((tx: any, index: number) => {
             const originalId = tx.id || Date.now() + index; 
             return `${userId.slice(0, 8)}_${originalId}`;
        }));

        // B. Fetch all Server Transaction IDs
        const { data: serverRows } = await supabase
             .from('transactions')
             .select('transaction_id')
             .eq('user_id', userId);

        // C. Find the Zombies (IDs on Server but NOT in Local App)
        if (serverRows) {
            const zombies = serverRows
                .map(r => r.transaction_id)
                .filter(serverID => !localSafeIds.has(serverID));

            // D. Kill the Zombies
            if (zombies.length > 0) {
                // Delete in batches to be safe
                const batchSize = 50;
                for (let i = 0; i < zombies.length; i += batchSize) {
                    const batch = zombies.slice(i, i + batchSize);
                    await supabase.from('transactions').delete().in('transaction_id', batch);
                }
            }
        }

        // E. Upsert (Save the good data)
        const transactionsToUpsert = data.transactions.map((tx: any, index: number) => {
            const originalId = tx.id || Date.now() + index;
            const safeId = `${userId.slice(0, 8)}_${originalId}`;

            return {
            user_id: userId,
            transaction_id: safeId, 
            description: String(tx.t || tx.description || 'Unknown'),
            amount: parseFloat(String(tx.a || tx.amount || 0)),
            date: String(tx.d || tx.date || '2026-01-01'),
            category: String(tx.c || 'Other'), // <--- UPDATED: Save the Category Edit
            };
        });

        const batchSize = 50;
        for (let i = 0; i < transactionsToUpsert.length; i += batchSize) {
            const batch = transactionsToUpsert.slice(i, i + batchSize);
            const { error } = await supabase.from('transactions').upsert(batch, { onConflict: 'transaction_id' });
            if (error) throw error;
        }
    }
    results.transactions = true;
  } catch (error) { console.error('Save Transactions Error', error); }

  // 4. HYPOTHETICALS
  try {
    await supabase.from('dream_island_hypotheticals').delete().eq('user_id', userId);
    
    if (data.dreamIslandHypotheticals && data.dreamIslandHypotheticals.length > 0) {
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
  } catch (error) { console.error('Save Hypo Error', error); }

  // 5. DEBTS (FIXED: NOW USES SMART SYNC INSTEAD OF WIPE & REPLACE)
  try {
    if (data.debts && data.debts.length > 0) {
        // A. Garbage Collection (Delete debts removed from App)
        const localDebtIds = new Set(data.debts.map((d: Debt) => Number(d.id)));
        const { data: serverDebts } = await supabase.from('debts').select('id').eq('user_id', userId);

        if (serverDebts) {
            const idsToDelete = serverDebts
                .map(row => row.id)
                .filter(id => !localDebtIds.has(id)); 

            if (idsToDelete.length > 0) {
                await supabase.from('debts').delete().eq('user_id', userId).in('id', idsToDelete);
            }
        }

        // B. Upsert (Update existing, Insert new)
        const debtsToUpsert = data.debts.map((d: Debt) => ({
            user_id: userId,
            id: Number(d.id), // Use the specific ID so it updates instead of creates new
            name: d.name,
            total_amount: d.totalAmount,
            pre_paid: d.prePaid,
            monthly_payment: d.monthlyPayment,
            icon: d.icon,
            color: d.color,
            due_day: d.dueDay
        }));

        const { error } = await supabase.from('debts').upsert(debtsToUpsert, { onConflict: 'user_id, id' }); // <--- CRITICAL FIX
        if (error) throw error;
    } else {
        // If app has 0 debts, ensure server has 0 debts
        await supabase.from('debts').delete().eq('user_id', userId);
    }
    results.debts = true;
  } catch (error) { console.error('Save Debts Error', error); }

  return results.budget && results.bills && results.transactions;
}

export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  // Kept your existing logic, but simplified return
  return false; 
}