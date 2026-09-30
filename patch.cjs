const fs = require('fs');
const file = 'src/components/RevenueTracker.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace imports
content = content.replace(
  "import { useAuthStore, useSettingsStore } from '../store';",
  "import { useAuthStore, useSettingsStore } from '../store';\nimport { createPortal } from 'react-dom';\nimport ScrollLock from './ScrollLock';"
);

// replace the modal
const modalStart = "      {/* Add / Edit Transaction Modal */}\n      <AnimatePresence>";
const startIndex = content.indexOf(modalStart);
const modalEnd = "  );\n}";
const newModal = `      {/* Add / Edit Transaction Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none">
          <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {editingId ? 'Edit Financial Record' : 'Add Financial Record'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form
              onSubmit={handleSave}
              className="p-5 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="space-y-6">
                {/* Type Selection Switcher */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({
                        ...p,
                        type: 'income',
                        category: INCOME_CATEGORIES[0]
                      }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-all",
                        formData.type === 'income' 
                          ? "bg-emerald-600 text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Income</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({
                        ...p,
                        type: 'expense',
                        category: EXPENSE_CATEGORIES[0]
                      }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-all",
                        formData.type === 'expense' 
                          ? "bg-rose-600 text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span>Expense</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Amount ({currency}) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-bold text-sm">{currency === 'USD' ? '$' : '៛'}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Transaction Date */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    >
                      {formData.type === 'income' 
                        ? INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                        : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      }
                    </select>
                  </div>

                  {/* Payment Channel */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Payment Channel
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    >
                      {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                    </select>
                  </div>
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    Invoice / Reference No (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData(p => ({ ...p, referenceNo: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    placeholder="e.g. INV-2026-001 or Receipt #"
                  />
                </div>

                {/* Description / Notes */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    placeholder="Provide additional details or notes regarding this cash transaction..."
                  />
                </div>
              </div>
              
              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-6 shrink-0 flex items-center justify-end gap-3 pb-2 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all flex items-center gap-2",
                    formData.type === 'income' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : \`Record \${formData.type === 'income' ? 'Income' : 'Expense'}\`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}`;

if (startIndex !== -1) {
  content = content.substring(0, startIndex) + newModal;
  fs.writeFileSync(file, content);
  console.log('Successfully updated modal');
} else {
  console.log('Could not find modal start');
}
