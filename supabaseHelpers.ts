import { supabase } from './supabaseClient'
import { AppData, Bill, Transaction } from './types'

// Load all data from Supabase
export async function loadDataFromSupabase(userId: string): Promise<AppData | null> {
  try {
    // Fetch budget
    const { data: budgetData, error: budgetError } = await supabase
      .from('budget')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (budgetError && budgetError.code !== 'PGRST116') throw budgetError

    // Fetch bills
    const { data: billsData, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)

    if (billsError) throw billsError

    // Fetch transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (transactionsError) throw transactionsError

    // Fetch dream island hypotheticals
    const { data: hypotheticalsData, error: hypotheticalsError } = await supabase
      .from('dream_island_hypotheticals')
      .select('*')
      .eq('user_id', userId)

    if (hypotheticalsError) throw hypotheticalsError

    // If no budget data exists, return null (new user)
    if (!budgetData) {
      return null
    }

    // Transform Supabase data into AppData format (matching YOUR types)
    const appData: AppData = {
      budget: {
        startingBalance: Number(budgetData.starting_balance),
        avgIncome: Number(budgetData.avg_income),
        annaContrib: 300.00, // Default value
        rentTotal: 0, // Default value
      },
      bills: billsData.map((bill: any) => ({
        id: bill.bill_id,
        name: bill.name,
        amount: Number(bill.amount),
        day: bill.due_date, // Maps due_date to day
        manualPaid: [], // Empty array as default
      })),
      transactions: transactionsData.map((tx: any) => {
  // Extract numeric ID from transaction_id (e.g., "20266bbf_103" → 103)
  const numericId = parseInt(tx.transaction_id.split('_').pop() || '0');
  
  return {
    id: numericId,
    d: tx.date, // Maps date to d
    t: tx.description, // Maps description to t
    a: Number(tx.amount), // Maps amount to a
    c: tx.category || '', // Maps category to c
  };
}),
      dreamIslandHypotheticals: hypotheticalsData.map((hyp: any) => ({
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

    console.log('🔍 LOADED DATA:', {
  bills: appData.bills.length,
  transactions: appData.transactions.length,
  firstTransaction: appData.transactions[0],
  budget: appData.budget
});

    return appData
  } catch (error) {
    console.error('Error loading data from Supabase:', error)
    return null
  }
}

// Save all data to Supabase with full error isolation
export async function saveDataToSupabase(userId: string, data: AppData): Promise<boolean> {
  const results = {
    budget: false,
    bills: false,
    transactions: false,
    hypotheticals: false
  };

  console.log('💾 Starting Supabase save for user:', userId);
  console.log('📊 Data to save:', {
    bills: data.bills?.length || 0,
    transactions: data.transactions?.length || 0,
    hypotheticals: data.dreamIslandHypotheticals?.length || 0
  });

  // ============== BUDGET ==============
  try {
    console.log('📤 Saving budget...');
    const { error: budgetError } = await supabase
      .from('budget')
      .upsert({
        user_id: userId,
        starting_balance: Number(data.budget.startingBalance),
        avg_income: Number(data.budget.avgIncome),
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id'
      });

    if (budgetError) throw budgetError;
    
    results.budget = true;
    console.log('✅ Budget saved');
  } catch (error) {
    console.error('❌ Budget save failed:', error);
    // Continue anyway - don't let budget failure stop everything
  }

  // ============== BILLS ==============
try {
  console.log('🗑️ Deleting old bills...');
  const { error: deleteBillsError } = await supabase
    .from('bills')
    .delete()
    .eq('user_id', userId);
  
  if (deleteBillsError) {
    console.error('Delete bills error:', deleteBillsError);
  }
  
  if (data.bills && data.bills.length > 0) {
    console.log(`📤 Inserting ${data.bills.length} bills...`);
    
    const billsToInsert = data.bills.map((bill: any) => {
      const billId = parseInt(String(bill.id));
      const amount = parseFloat(String(bill.amount));
      const dueDate = parseInt(String(bill.day || bill.dueDate || 1));
      
      // Validate ranges
      if (billId < 0 || billId > 1000) {
        console.warn(`Invalid bill_id: ${billId}, using 0`);
      }
      if (dueDate < 1 || dueDate > 31) {
        console.warn(`Invalid due_date: ${dueDate}, using 1`);
      }
      
      return {
        user_id: userId,
        bill_id: Math.max(0, Math.min(1000, billId)), // Clamp between 0-1000
        name: String(bill.name || 'Unknown'),
        amount: amount,
        due_date: Math.max(1, Math.min(31, dueDate)), // Clamp between 1-31
        category: '',
      };
    });

    console.log('Bills to insert:', JSON.stringify(billsToInsert, null, 2));

    const { error: billsError, data: insertedBills } = await supabase
      .from('bills')
      .insert(billsToInsert);

    if (billsError) {
      console.error('Bills insert error details:', JSON.stringify(billsError, null, 2));
      throw billsError;
    }
    
    results.bills = true;
    console.log('✅ Bills inserted:', insertedBills);
  } else {
    results.bills = true;
    console.log('✅ No bills to insert');
  }
} catch (error) {
  console.error('❌ Bills save failed:', error);
}

  // ============== TRANSACTIONS ==============
  try {
    console.log('🗑️ Deleting old transactions...');
    await supabase.from('transactions').delete().eq('user_id', userId);
    
    if (data.transactions && data.transactions.length > 0) {
      console.log(`📤 Inserting ${data.transactions.length} transactions...`);
      
      // CRITICAL FIX: Generate safe sequential IDs instead of using huge timestamps
      const transactionsToInsert = data.transactions.map((tx: any, index: number) => {
        // Ensure all values are properly typed and safe
        const safeId = `${userId.slice(0, 8)}_${index}`;
        
        return {
          user_id: userId,
          transaction_id: safeId, // Safe unique ID
          description: String(tx.t || tx.description || 'Unknown'),
          amount: parseFloat(String(tx.a || tx.amount || 0)),
          date: String(tx.d || tx.date || '2026-01-01'),
          category: String(tx.c || tx.category || ''),
        };
      });

      console.log('First 3 transactions:', JSON.stringify(transactionsToInsert.slice(0, 3), null, 2));

      // Insert in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
        const batch = transactionsToInsert.slice(i, i + batchSize);
        console.log(`📤 Inserting batch ${Math.floor(i/batchSize) + 1} (${batch.length} transactions)...`);
        
        const { error: batchError } = await supabase
          .from('transactions')
          .insert(batch);

        if (batchError) {
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError);
          throw batchError;
        }
      }
      
      results.transactions = true;
      console.log('✅ All transactions inserted');
    } else {
      results.transactions = true;
      console.log('✅ No transactions to insert');
    }
  } catch (error) {
    console.error('❌ Transactions save failed:', error);
    // Continue anyway
  }

  // ============== HYPOTHETICALS ==============
  try {
    console.log('🗑️ Deleting old hypotheticals...');
    await supabase.from('dream_island_hypotheticals').delete().eq('user_id', userId);
    
    if (data.dreamIslandHypotheticals && data.dreamIslandHypotheticals.length > 0) {
      console.log(`📤 Inserting ${data.dreamIslandHypotheticals.length} hypotheticals...`);
      
      const { error: hypotheticalsError } = await supabase
        .from('dream_island_hypotheticals')
        .insert(
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

      if (hypotheticalsError) throw hypotheticalsError;
      
      results.hypotheticals = true;
      console.log('✅ Hypotheticals inserted');
    } else {
      results.hypotheticals = true;
      console.log('✅ No hypotheticals to insert');
    }
  } catch (error) {
    console.error('❌ Hypotheticals save failed:', error);
  }

  // ============== RESULTS ==============
  console.log('📊 Save results:', results);
  
  const allSuccess = results.budget && results.bills && results.transactions && results.hypotheticals;
  const someSuccess = results.budget || results.bills || results.transactions || results.hypotheticals;
  
  if (allSuccess) {
    console.log('✅✅✅ ALL DATA SAVED SUCCESSFULLY');
    return true;
  } else if (someSuccess) {
    console.log('⚠️ PARTIAL SAVE - Some tables succeeded, some failed');
    console.log('What succeeded:', Object.entries(results).filter(([k, v]) => v).map(([k]) => k));
    console.log('What failed:', Object.entries(results).filter(([k, v]) => !v).map(([k]) => k));
    return false;
  } else {
    console.log('❌❌❌ COMPLETE SAVE FAILURE');
    return false;
  }
}

// One-time migration from localStorage to Supabase
export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  console.log('🔍 MIGRATION CHECK: Starting...');
  
  try {
    // Check if Supabase already has data
    console.log('🔍 MIGRATION CHECK: Checking Supabase for existing data...');
    const existingData = await loadDataFromSupabase(userId);
    
    if (existingData) {
      console.log('⏭️ MIGRATION SKIP: Supabase already has data');
      return false // Already migrated
    }
    
    console.log('✅ MIGRATION CHECK: Supabase is empty, checking localStorage...');

    // Check ALL possible localStorage keys
    const possibleKeys = [
      'moneyflow_data_v35',
      'moneyflow_data',
      'dinero_flow_data',
      'dinero-flow-data'
    ];
    
    let localData = null;
    let usedKey = null;
    
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        localData = data;
        usedKey = key;
        console.log(`✅ FOUND DATA in localStorage under key: "${key}"`);
        break;
      }
    }

    if (!localData) {
      console.log('❌ MIGRATION SKIP: No localStorage data found in any key');
      console.log('Checked keys:', possibleKeys);
      console.log('All localStorage keys:', Object.keys(localStorage));
      return false
    }

    console.log(`📦 MIGRATION: Found ${localData.length} characters of data`);
    
    // Parse localStorage data
    const parsedData = JSON.parse(localData);
    console.log('📦 MIGRATION: Parsed data:', {
      bills: parsedData.bills?.length || 0,
      transactions: parsedData.transactions?.length || 0,
      hasbudget: !!parsedData.budget
    });
    
    // Upload to Supabase
    console.log('📤 MIGRATION: Uploading to Supabase...');
    const success = await saveDataToSupabase(userId, parsedData);
    
    if (success) {
      console.log('✅✅✅ MIGRATION SUCCESS! Data uploaded to Supabase');
      return true
    } else {
      console.error('❌ MIGRATION FAILED: Upload returned false');
      return false
    }
  } catch (error) {
    console.error('❌ MIGRATION ERROR:', error);
    return false
  }
}