export interface IBudgetItem {
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export interface Category {
  value: string;
  text: string;
}

export interface Categories {
  expenses?: Category[];
  incomes?: Category[];
}
