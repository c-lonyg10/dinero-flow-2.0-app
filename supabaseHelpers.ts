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
    // Save budget (upsert = insert or update)
    const { error: budgetError } = await supabase
      .from('budget')
      .upsert({
        user_id: userId,
        starting_balance: data.budget.startingBalance,
        avg_income: data.budget.avgIncome,
        updated_at: new Date().toISOString(),
      }, { 
    onConflict: 'user_id'  // ← ADD THIS LINE - tells it to update if user_id exists
  })

    if (budgetError) throw budgetError

    // Delete existing bills and insert new ones
    await supabase.from('bills').delete().eq('user_id', userId)
    
    if (data.bills.length > 0) {
      const { error: billsError } = await supabase
        .from('bills')
        .insert(
          data.bills.map((bill: Bill) => ({
            user_id: userId,
            bill_id: bill.id,
            name: bill.name,
            amount: bill.amount,
            due_date: bill.day, // Maps day to due_date
            category: '', // Empty string as default
          }))
        )

      if (billsError) throw billsError
    }

    // Delete existing transactions and insert new ones
const { error: deleteError } = await supabase
  .from('transactions')
  .delete()
  .eq('user_id', userId);

if (deleteError) {
  console.error('❌ Error deleting transactions:', deleteError);
  throw deleteError;
}

if (data.transactions.length > 0) {
  const transactionsToInsert = data.transactions.map((tx: Transaction) => ({
    user_id: userId,
    transaction_id: tx.id.toString(),
    description: tx.t,
    amount: tx.a,
    date: tx.d,
    category: tx.c,
  }));

  console.log('📤 Attempting to insert transactions:', transactionsToInsert);

  const { error: transactionsError } = await supabase
    .from('transactions')
    .insert(transactionsToInsert);

  if (transactionsError) {
    console.error('❌ Error inserting transactions:', transactionsError);
    throw transactionsError;
  }

  console.log('✅ Transactions inserted successfully');
}

    // Delete existing hypotheticals and insert new ones
    await supabase.from('dream_island_hypotheticals').delete().eq('user_id', userId)
    
    if (data.dreamIslandHypotheticals && data.dreamIslandHypotheticals.length > 0) {
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
        )

      if (hypotheticalsError) throw hypotheticalsError
    }

    return true
  } catch (error) {
    console.error('Error saving data to Supabase:', error)
    return false
  }
}

// One-time migration from localStorage to Supabase
export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  try {
    // Check if Supabase already has data
    const existingData = await loadDataFromSupabase(userId)
    if (existingData) {
      console.log('Supabase already has data, skipping migration')
      return false // Already migrated
    }

    // Check if localStorage has data
    const localData = localStorage.getItem('moneyflow_data_v35')
    if (!localData) {
      console.log('No localStorage data to migrate')
      return false // No data to migrate
    }

    // Parse localStorage data
    const parsedData = JSON.parse(localData)
    
    // Upload to Supabase
    const success = await saveDataToSupabase(userId, parsedData)
    
    if (success) {
      console.log('✅ Migration successful! Data uploaded to Supabase')
      return true
    } else {
      console.error('❌ Migration failed')
      return false
    }
  } catch (error) {
    console.error('Error during migration:', error)
    return false
  }
}