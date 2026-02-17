import './styles/style.scss';
import { type IBudgetItem } from './models.ts';
import { type Categories } from './models.ts';

const currentDay: HTMLElement | null = document.querySelector('#currentDay');
const descriptionInput: HTMLInputElement | null = document.querySelector('#descriptionInput');
const addedToList: HTMLElement | null = document.querySelector('#addedToList');

const amountInput: HTMLInputElement | null = document.querySelector('#amountInput');
const addButton: HTMLButtonElement | null = document.querySelector('#addButton');
const incomeButton: HTMLInputElement | null = document.querySelector('#incomeButton');
const expenseButton: HTMLInputElement | null = document.querySelector('#expenseButton');
const LS_DB_ID: string = 'myBudgetAppDataStorage';

let incomeItems: IBudgetItem[] = [];
let expenseItems: IBudgetItem[] = [];
let myData: IBudgetItem[] = [];

// Track if fields have been touched by user
let descriptionTouched = false;
let amountTouched = false;

// Validation patterns for input fields
const validationPatterns: Record<string, RegExp> = {
  description: /^[a-zA-ZåäöÅÄÖ\s]{2,}$/,
  amount: /^[0-9]+(\.[0-9]{1,2})?$/,
};

/**
 *  Retrieves the current month and year, formats it as a string, and returns it. The month is formatted in Swedish locale to display the full month name followed by the year.
 * @returns {string} The formatted current month and year.
 */
function getCurrentMonth(): string {
  const toDay = new Date();
  const month = toDay.toLocaleString('sv-SE', { month: 'long' });
  const year = toDay.getFullYear();
  return `${month} ${year}`;
}

if (currentDay) {
  currentDay.textContent = getCurrentMonth();
}

if (incomeButton !== null) {
  incomeButton.addEventListener('change', () => {
    if (incomeButton.checked && expenseButton) {
      expenseButton.checked = false;
    }
    validateInputs();
  });
}

if (expenseButton !== null) {
  expenseButton.addEventListener('change', () => {
    if (expenseButton.checked && incomeButton) {
      incomeButton.checked = false;
    }
    validateInputs();
  });
}

// Ensure add button is hidden on page load
if (addButton) {
  addButton.classList.add('hidden');
}

if (descriptionInput) {
  descriptionInput.addEventListener('input', evt => {
    const target = evt.target as HTMLInputElement;
    target.value = target.value.replace(/[^a-zA-ZåäöÅÄÖ\s]/g, '');
    descriptionTouched = true;
  });
}

if (amountInput) {
  amountInput.addEventListener('input', () => {
    amountTouched = true;
    validateInputs();
  });
}

if (descriptionInput) {
  descriptionInput.addEventListener('input', validateInputs);
}

/**
 *  Validates the user inputs for description, amount, and type (income or expense). It checks if the required input elements are present and if the description and amount fields are not empty. It also ensures that either the income or expense button is selected. If all conditions are met, it enables the add button; otherwise, it keeps it hidden.
 * @returns {void}
 */
function validateInputs(): void {
  if (!descriptionInput || !amountInput || !addButton) {
    return;
  }

  addButton?.classList.add('hidden');

  // Get error message elements
  const descError = descriptionInput.nextElementSibling as HTMLElement | null;
  const amountError = amountInput.nextElementSibling as HTMLElement | null;

  // Validate description - only show error if field has been touched
  if (descriptionTouched && descriptionInput.value.length > 0) {
    const isDescValid = validationPatterns.description.test(descriptionInput.value);
    descError?.classList.toggle('hidden', isDescValid);
  } else {
    // Keep error hidden if field hasn't been touched or is empty
    descError?.classList.add('hidden');
  }

  // Validate amount - only show error if field has been touched
  if (amountTouched && amountInput.value !== '') {
    const amount = parseFloat(amountInput.value);
    const isAmountValid = validationPatterns.amount.test(amountInput.value) && amount > 0;
    amountError?.classList.toggle('hidden', isAmountValid);
  } else {
    // Keep error hidden if field hasn't been touched or is empty
    amountError?.classList.add('hidden');
  }

  // Only show add button if all validations pass
  const isDescValid = validationPatterns.description.test(descriptionInput.value);
  const amount = parseFloat(amountInput.value);
  const isAmountValid = validationPatterns.amount.test(amountInput.value) && amount > 0;
  const isTypeSelected =
    (incomeButton?.checked || expenseButton?.checked) && !(incomeButton?.checked && expenseButton?.checked);

  if (isDescValid && isAmountValid && isTypeSelected) {
    addButton.classList.remove('hidden');
  }
}

/**
 *  Displays a temporary message indicating that an item has been added to the list. It updates the text content of the addedToList element to "Added to list!" and then clears the message after 2 seconds.
 * @returns {void}
 */
function alertAddedToList(): void {
  if (!addedToList) return;
  addedToList.textContent = 'Added to list!';
  setTimeout(() => {
    addedToList.textContent = '';
  }, 2000);
}

/**
 *  Adds a new budget item to the appropriate list (income or expense) based on the selected type. It retrieves the description, amount, and category from the input fields, creates a new budget item object, and adds it to the corresponding array and the myData array. After adding the item, it clears the input fields, updates the displayed lists, recalculates the budget, and saves the updated data to localStorage.
 * @returns {void}
 */
function addToList(): void {
  if (!descriptionInput || !amountInput) {
    console.error('Required input elements not found');
    return;
  }
  const catDropdown: HTMLSelectElement | null = document.querySelector('#categoryDropdown');
  const category = catDropdown ? catDropdown.value : '';
  const description = descriptionInput.value.charAt(0).toUpperCase() + descriptionInput.value.slice(1);
  const amount = parseFloat(amountInput.value);
  // Remove this early return - it prevents the rest of the function from executing
  // return;

  if (incomeButton?.checked) {
    const incomeItem: IBudgetItem = {
      description,
      amount,
      category,
      type: 'income',
    };
    incomeItems.push(incomeItem);
    myData.push(incomeItem);
    renderIncomeItemsFiltered();
  } else if (expenseButton?.checked) {
    const expenseItem: IBudgetItem = {
      description,
      amount,
      category,
      type: 'expense',
    };
    expenseItems.push(expenseItem);
    myData.push(expenseItem);
    renderExpenseItemsFiltered();
  }

  descriptionInput.value = '';
  amountInput.value = '';

  // Reset touched flags and hide error messages
  descriptionTouched = false;
  amountTouched = false;
  const descError = document.querySelector('#descriptionInput + .error');
  const amountError = document.querySelector('#amountInput + .error');
  descError?.classList.add('hidden');
  amountError?.classList.add('hidden');

  // Hide add button after adding
  if (addButton) {
    addButton.classList.add('hidden');
  }

  calculateBudget();
  saveToMyBudgetAppDataStorage();
}

if (addButton) {
  addButton.addEventListener('click', addToList);
  addButton.addEventListener('click', alertAddedToList);
}

/**
 *  Retrieves the currently selected category from the category dropdown. It checks if the dropdown element exists and returns its value; if the dropdown is not found, it defaults to returning 'all'.
 * @returns {string} The value of the selected category or 'all' if the dropdown is not found.
 */
function getSelectedCategory() {
  const catDropdown: HTMLSelectElement | null = document.querySelector('#categoryDropdown');
  return catDropdown ? catDropdown.value : 'all';
}

/**
 *  Renders the list of income items based on the selected category filter. It clears the existing list and iterates through the income items, creating list elements for those that match the selected category. Each item includes a delete button that allows the user to remove the item from both the incomeItems array and the myData array, followed by re-rendering the list and recalculating the budget.
 * @returns {void}
 */
function renderIncomeItemsFiltered(): void {
  const incomeList: HTMLUListElement | null = document.querySelector('#incomeList');
  if (!incomeList) return;
  incomeList.innerHTML = '';
  const selectedCategory = getSelectedCategory();
  incomeItems.forEach((item, index) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return;
    const listItem = document.createElement('li');
    listItem.textContent = `${item.description}: ${item.amount.toFixed(2)} SEK`;
    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('aria-label', 'Delete item');
    deleteButton.innerHTML = '<i class="fa fa-close" style="font-size:16px"></i>';
    deleteButton.setAttribute('data-item', index.toString());
    deleteButton.addEventListener('click', () => {
      incomeItems.splice(index, 1);
      const myDataIndex = myData.findIndex(
        d =>
          d.type === 'income' &&
          d.description === item.description &&
          d.amount === item.amount &&
          d.category === item.category
      );
      if (myDataIndex !== -1) {
        myData.splice(myDataIndex, 1);
      }
      renderIncomeItemsFiltered();
      calculateBudget();
      saveToMyBudgetAppDataStorage();
    });
    listItem.appendChild(deleteButton);
    incomeList.appendChild(listItem);
  });
}

/**
 *  Renders the list of expense items based on the selected category filter. It clears the existing list and iterates through the expense items, creating list elements for those that match the selected category. Each item includes a delete button that allows the user to remove the item from both the expenseItems array and the myData array, followed by re-rendering the list and recalculating the budget.
 * @returns {void}
 */
function renderExpenseItemsFiltered(): void {
  const expenseList: HTMLUListElement | null = document.querySelector('#expenseList');
  if (!expenseList) return;
  expenseList.innerHTML = '';
  const selectedCategory = getSelectedCategory();
  expenseItems.forEach((item, index) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return;
    const listItem = document.createElement('li');
    listItem.textContent = `${item.description}: ${item.amount.toFixed(2)} SEK`;
    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('aria-label', 'Delete item');
    deleteButton.innerHTML = '<i class="fa fa-close" style="font-size:16px"></i>';
    deleteButton.setAttribute('data-item', index.toString());
    deleteButton.addEventListener('click', () => {
      expenseItems.splice(index, 1);
      const myDataIndex = myData.findIndex(
        d =>
          d.type === 'expense' &&
          d.description === item.description &&
          d.amount === item.amount &&
          d.category === item.category
      );
      if (myDataIndex !== -1) {
        myData.splice(myDataIndex, 1);
      }
      renderExpenseItemsFiltered();
      calculateBudget();
      saveToMyBudgetAppDataStorage();
    });
    listItem.appendChild(deleteButton);
    expenseList.appendChild(listItem);
  });
}

const catDropdownFilter = document.querySelector('#categoryDropdown');
if (catDropdownFilter) {
  catDropdownFilter.addEventListener('change', () => {
    renderIncomeItemsFiltered();
    renderExpenseItemsFiltered();
  });
}

/**
 *  Ensures that the "Show all" option is present in the category dropdown. It checks if the dropdown exists and if the "Show all" option is already included. If not, it creates and inserts the "Show all" option at the beginning of the dropdown.
 * @returns {void}
 */
function patchCategoryDropdownAllOption() {
  const catDropdown = document.querySelector('#categoryDropdown');
  if (!catDropdown) return;
  if (!catDropdown.querySelector('option[value="all"]')) {
    const allOption = new Option('Show all', 'all');
    catDropdown.insertBefore(allOption, catDropdown.firstChild);
  }
}

const catDropdownElement = document.querySelector('#categoryDropdown');
if (catDropdownElement) {
  const categoryDropdownObserver = new MutationObserver(() => {
    patchCategoryDropdownAllOption();
  });
  categoryDropdownObserver.observe(catDropdownElement, { childList: true });
  patchCategoryDropdownAllOption();
}
/**
 *  Calculates the remaining budget by summing up the total income and total expenses, then updates the display of the remaining amount. It also changes the color of the remaining amount to red if it's negative and green if it's positive or zero.
 * @returns {void}
 */

function calculateBudget() {
  const totalIncome = incomeItems.reduce((total, item) => total + item.amount, 0);
  const totalExpenses = expenseItems.reduce((total, item) => total + item.amount, 0);
  const remainingAmount = totalIncome - totalExpenses;

  const remainingAmountElement: HTMLElement | null = document.querySelector('#remainingAmount');

  if (!remainingAmountElement) {
    return;
  }

  remainingAmountElement.textContent = remainingAmount.toFixed(2);
  if (remainingAmount < 0) {
    remainingAmountElement.style.color = '#F9AEAE';
  } else {
    remainingAmountElement.style.color = '#95D096';
  }
}

/**
 * Saves the current state of the budget data (income and expenses) to localStorage. It converts the myData array into a JSON string and stores it under the key defined by LS_DB_ID.
 */
function saveToMyBudgetAppDataStorage() {
  const stringified = JSON.stringify(myData);
  localStorage.setItem(LS_DB_ID, stringified);
}

/**
 *  Reads the budget data from localStorage and updates the application's state accordingly. It retrieves the saved data, parses it, and separates it into income and expense items. It then renders the filtered lists of income and expenses and recalculates the budget.
 * @returns {void}
 */
function readToMyBudgetAppDataStorage() {
  const toggleCategoryBtn = document.querySelector('#toggleCategoryBtn');
  toggleCategoryBtn?.addEventListener('click', readToMyBudgetAppDataStorage);
  const savedBudgetData = localStorage.getItem(LS_DB_ID);

  if (savedBudgetData === null) {
    console.warn('There is no data in your localStorage');

    return;
  }

  myData = JSON.parse(savedBudgetData);
  incomeItems = myData.filter(item => item.type === 'income');
  expenseItems = myData.filter(item => item.type === 'expense');
  renderIncomeItemsFiltered();
  renderExpenseItemsFiltered();
  calculateBudget();
}

import categories from './categories.json';

const LS_CATEGORIES_ID = 'myBudgetAppCategories';
/**
 *  Saves the provided categories object to localStorage under the key defined by LS_CATEGORIES_ID. The object is stringified before being stored.
 * @param categoriesObj The categories object to be saved.
 * @returns {void}
 */

function saveCategoriesToLocalStorage(categoriesObj: object): void {
  localStorage.setItem(LS_CATEGORIES_ID, JSON.stringify(categoriesObj));
}

/**
 *  Retrieves the categories from localStorage. If the data is not found or cannot be parsed, it returns null.
 * @returns {Categories | null}
 */
function getCategoriesFromLocalStorage(): Categories | null {
  const data = localStorage.getItem(LS_CATEGORIES_ID);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Could not parse categories from localStorage:', e as unknown);
    }
  }
  return null;
}

/**
 * Ensures that the categories are stored in localStorage. If not, it saves the default categories from the imported JSON file.
 */
function ensureCategoriesInLocalStorage() {
  if (!localStorage.getItem(LS_CATEGORIES_ID)) {
    saveCategoriesToLocalStorage(categories);
  }
}
/**
 * Populates the category dropdown with options from localStorage or the default categories.
 * @returns {void}
 */
function populateCategoryDropdown(): void {
  const catDropdown: HTMLSelectElement | null = document.querySelector('#categoryDropdown');
  if (!catDropdown) return;
  catDropdown.innerHTML = '';
  const cats = getCategoriesFromLocalStorage() || categories;
  if (cats.expenses) {
    cats.expenses.forEach(category => {
      catDropdown.innerHTML += `<option value="${category.value}">${category.text}</option>`;
    });
  }
  if (cats.incomes) {
    cats.incomes.forEach(category => {
      catDropdown.innerHTML += `<option value="${category.value}">${category.text}</option>`;
    });
  }
}

ensureCategoriesInLocalStorage();
populateCategoryDropdown();
readToMyBudgetAppDataStorage();
