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
      transactions: transactionsData.map((tx: any) => ({
        id: parseInt(tx.transaction_id),
        d: tx.date, // Maps date to d
        t: tx.description, // Maps description to t
        a: Number(tx.amount), // Maps amount to a
        c: tx.category || '', // Maps category to c
      })),
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

    return appData
  } catch (error) {
    console.error('Error loading data from Supabase:', error)
    return null
  }
}

// Save all data to Supabase
export async function saveDataToSupabase(userId: string, data: AppData): Promise<boolean> {
  try {
    console.log('💾 Starting Supabase save for user:', userId);
    
    // Save budget (upsert with proper conflict resolution)
    console.log('📤 Saving budget...');
    const { error: budgetError } = await supabase
      .from('budget')
      .upsert({
        user_id: userId,
        starting_balance: data.budget.startingBalance,
        avg_income: data.budget.avgIncome,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id'
      })

    if (budgetError) {
      console.error('❌ Budget save error:', budgetError);
      throw budgetError;
    }
    console.log('✅ Budget saved');

    // Delete existing bills first
    console.log('🗑️ Deleting old bills...');
    const { error: deleteBillsError } = await supabase
      .from('bills')
      .delete()
      .eq('user_id', userId);
    
    if (deleteBillsError) {
      console.error('❌ Error deleting bills:', deleteBillsError);
      throw deleteBillsError;
    }
    
    // Insert new bills
    if (data.bills.length > 0) {
      console.log(`📤 Inserting ${data.bills.length} bills...`);
      
      const billsToInsert = data.bills.map((bill: Bill) => {
        const formatted = {
          user_id: userId,
          bill_id: Number(bill.id),
          name: String(bill.name),
          amount: Number(bill.amount),
          due_date: Number(bill.day),
          category: '', // Always empty string for bills
        };
        return formatted;
      });

      console.log('First bill sample:', billsToInsert[0]);

      const { error: billsError } = await supabase
        .from('bills')
        .insert(billsToInsert);

      if (billsError) {
        console.error('❌ Bills insert error:', billsError);
        console.error('Error details:', JSON.stringify(billsError, null, 2));
        throw billsError;
      }
      console.log('✅ Bills inserted');
    }

    // Delete existing transactions
    console.log('🗑️ Deleting old transactions...');
    const { error: deleteTxError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);
    
    if (deleteTxError) {
      console.error('❌ Error deleting transactions:', deleteTxError);
      throw deleteTxError;
    }
    
    // Insert new transactions
    if (data.transactions.length > 0) {
      console.log(`📤 Inserting ${data.transactions.length} transactions...`);
      
      const transactionsToInsert = data.transactions.map((tx: Transaction) => {
        const formatted = {
          user_id: userId,
          transaction_id: String(tx.id),
          description: String(tx.t || 'Unknown'),
          amount: Number(tx.a),
          date: String(tx.d),
          category: String(tx.c || ''), // Ensure it's always a string
        };
        return formatted;
      });

      console.log('First 3 transactions sample:', transactionsToInsert.slice(0, 3));

      const { error: transactionsError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (transactionsError) {
        console.error('❌ Transactions insert error:', transactionsError);
        console.error('Error details:', JSON.stringify(transactionsError, null, 2));
        console.error('Failed transactions sample:', transactionsToInsert.slice(0, 5));
        throw transactionsError;
      }
      console.log('✅ Transactions inserted');
    }

    // Delete existing hypotheticals
    console.log('🗑️ Deleting old hypotheticals...');
    await supabase.from('dream_island_hypotheticals').delete().eq('user_id', userId);
    
    // Insert new hypotheticals
    if (data.dreamIslandHypotheticals && data.dreamIslandHypotheticals.length > 0) {
      console.log(`📤 Inserting ${data.dreamIslandHypotheticals.length} hypotheticals...`);
      
      const { error: hypotheticalsError } = await supabase
        .from('dream_island_hypotheticals')
        .insert(
          data.dreamIslandHypotheticals.map((hyp: any) => ({
            user_id: userId,
            name: hyp.name,
            amount: hyp.amount,
            type: hyp.type,
            date: hyp.date,
            total_amount: hyp.totalAmount,
            number_of_payments: hyp.numberOfPayments,
            start_date: hyp.startDate,
          }))
        );

      if (hypotheticalsError) {
        console.error('❌ Hypotheticals insert error:', hypotheticalsError);
        throw hypotheticalsError;
      }
      console.log('✅ Hypotheticals inserted');
    }

    console.log('✅✅✅ ALL DATA SAVED SUCCESSFULLY');
    return true;
    
  } catch (error) {
    console.error('❌❌❌ SAVE FAILED:', error);
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