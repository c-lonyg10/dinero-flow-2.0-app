export interface Transaction {
    id: number;
    d: string; // Date YYYY-MM-DD
    t: string; // Title/Description
    a: number; // Amount
    c: string; // Category
  }
  
  export interface Bill {
    id: number;
    name: string;
    amount: number;
    day: number;
    manualPaid?: string[]; // Array of "YYYY-MM" strings
    dueDate?: number;
  }
  
  export interface Budget {
    avgIncome: number;
    annaContrib: number;
    rentTotal: number;
    startingBalance: number;
  }
  
  export interface AppData {
    budget: Budget;
    bills: Bill[];
    transactions: Transaction[];
    dreamIslandHypotheticals: DreamIslandHypothetical[];
  }

  export interface DreamIslandHypothetical {
  id: string;
  name: string;
  amount: number;
  type: 'one-time' | 'recurring' | 'payment-plan';
  date?: string;
  totalAmount?: number;
  numberOfPayments?: number;
  startDate?: string;
}
  
  export type TabType = 'dashboard' | 'calendar' | 'rent' | 'spending' | 'debt' | 'transactions' | 'settings' | 'fun' | 'dreamIsland';
  
  export const INITIAL_DATA: AppData = {
    budget: { avgIncome: 1327.36, annaContrib: 300.00, rentTotal: 0, startingBalance: 0 },
    bills: [
      {id:1,name:"Flex Rent",amount:500.00,day:1},
      {id:2,name:"Student Loans",amount:153.83,day:5},
      {id:3,name:"2nd Credit Card",amount:45.00,day:5},
      {id:4,name:"Farmers Insurance",amount:224.00,day:7},
      {id:5,name:"Car Loan",amount:169.32,day:11},
      {id:6,name:"YouTube Premium",amount:24.54,day:12},
      {id:7,name:"Disney Bundle",amount:20.27,day:12},
      {id:8,name:"Tio Frank",amount:787.50,day:15},
      {id:9,name:"Flex Finance",amount:400.00,day:15},
      {id:10,name:"Piedmont Health",amount:47.45,day:22},
      {id:11,name:"Disney+",amount:6.43,day:28},
      {id:12,name:"Google Store",amount:25.00,day:28},
      {id:13,name:"Chase Credit Card",amount:75.00,day:28}
    ],
    transactions: [],
    dreamIslandHypotheticals: [],
  };