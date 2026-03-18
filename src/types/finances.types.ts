export interface ManualExpenseForm {
  date: string;
  productiveProject: string;
  partnerProject: string;
  expenseType: string;
  quantity: string;
  unitValue: string;
  currency: string;
  observations: string;
  expenseRepresentation: boolean;
}

export interface ManualExpenseEntry extends ManualExpenseForm {
  id: string;
  createdAtLabel: string;
}
