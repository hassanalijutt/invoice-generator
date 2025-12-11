import { useState } from 'react';
import API from '../api';

export default function InvoiceForm() {
  const [seller, setSeller] = useState({ name: 'My Company', address: '', email: '' });
  const [client, setClient] = useState({ name: '', address: '', email: '' });
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  function updateItem(index, key, value) {
    const arr = [...items];
    arr[index][key] = value;
    setItems(arr);
  }
  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  }
  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax - Number(discount || 0);

  function resetForm() {
    setSeller({ name: 'My Company', address: '', email: '' });
    setClient({ name: '', address: '', email: '' });
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setTaxPercent(0);
    setDiscount(0);
    setNotes('');
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { seller, client, items, taxPercent, discount, notes };
      const res = await API.post('/invoices', payload);
      if (res.data && res.data.id) {
        const link = document.createElement('a');
        link.href = `http://localhost:4000${res.data.pdfPath}`;
        link.download = `invoice_${res.data.id}.pdf`;
        document.body.appendChild(link);
        link.click(); 
        link.remove();
        alert('Invoice created and downloaded!');
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create invoice');
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Professional Invoice Generator</h1>
          <p className="text-gray-600">Create and download invoices in seconds</p>
        </div>

        <form onSubmit={handleGenerate} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Seller & Client Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Seller Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800">From (Your Business)</h2>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Business Name"
                  value={seller.name}
                  onChange={e => setSeller({ ...seller, name: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Business Address"
                  value={seller.address}
                  onChange={e => setSeller({ ...seller, address: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Email Address"
                  type="email"
                  value={seller.email}
                  onChange={e => setSeller({ ...seller, email: e.target.value })}
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800">Bill To (Client)</h2>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Client Name"
                  value={client.name}
                  onChange={e => setClient({ ...client, name: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Client Address"
                  value={client.address}
                  onChange={e => setClient({ ...client, address: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Client Email"
                  type="email"
                  value={client.email}
                  onChange={e => setClient({ ...client, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800">Invoice Items</h2>
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 mb-3 px-2 text-sm font-semibold text-gray-600">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {items.map((it, idx) => {
                const amount = Number(it.quantity) * Number(it.unitPrice);
                return (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="grid md:grid-cols-12 gap-3 items-center">
                      <input
                        className="md:col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Item description"
                        value={it.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                      />
                      <input
                        type="number"
                        min="1"
                        className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Price"
                        value={it.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                      />
                      <div className="md:col-span-2 px-3 py-2 font-semibold text-gray-700">
                        ${amount.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        className="md:col-span-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                        onClick={() => removeItem(idx)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center shadow-md"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </button>
          </div>

          {/* Tax, Discount, Notes */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Percentage (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., 10"
                value={taxPercent}
                onChange={e => setTaxPercent(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="0.00"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Additional notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax ({taxPercent}%):</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span className="font-semibold text-red-600">-${Number(discount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-green-300 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              disabled={creating}
            >
              {creating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Invoice...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate & Download PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
