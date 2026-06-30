import React, { useState } from 'react';
import { PlusCircle, Dog, Pill, Bell, FileText, Trash2, Edit2, Check, X, AlertTriangle, Calendar, Download, Upload, Building2 } from 'lucide-react';

const MEDICATIONS = {
  nexgard: { name: 'Nexgard', intervalDays: 30, color: 'blue' },
  drontal: { name: 'Drontal', intervalDays: 90, color: 'purple' }
};

export default function DogMedicationTracker() {
  const [dogs, setDogs] = useState([
    { id: 1, name: 'Sample Dog', nexgardLast: '2026-01-15', drontalLast: '2025-12-01' }
  ]);
  const [bills, setBills] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: '',
    email: ''
  });
  const [showAddDog, setShowAddDog] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showGenerateBill, setShowGenerateBill] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [newDog, setNewDog] = useState({ name: '', nexgardLast: '', drontalLast: '' });
  const [newBill, setNewBill] = useState({ description: '', amount: '', dueDate: '' });
  const [activeTab, setActiveTab] = useState('medications');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysUntilDue = (lastDate, intervalDays) => {
    if (!lastDate) return null;
    const last = new Date(lastDate);
    const nextDue = new Date(last);
    nextDue.setDate(nextDue.getDate() + intervalDays);
    const diffTime = nextDue - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (daysUntil) => {
    if (daysUntil === null) return 'gray';
    if (daysUntil < 0) return 'red';
    if (daysUntil <= 7) return 'orange';
    return 'green';
  };

  const getStatusText = (daysUntil) => {
    if (daysUntil === null) return 'Not set';
    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days!`;
    if (daysUntil === 0) return 'Due today!';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  const addDog = () => {
    if (!newDog.name) return;
    setDogs([...dogs, { ...newDog, id: Date.now() }]);
    setNewDog({ name: '', nexgardLast: '', drontalLast: '' });
    setShowAddDog(false);
  };

  const updateDog = (id, updates) => {
    setDogs(dogs.map(d => d.id === id ? { ...d, ...updates } : d));
    setEditingDog(null);
  };

  const deleteDog = (id) => {
    setDogs(dogs.filter(d => d.id !== id));
  };

  const markGiven = (dogId, medType) => {
    const todayStr = today.toISOString().split('T')[0];
    const field = medType === 'nexgard' ? 'nexgardLast' : 'drontalLast';
    updateDog(dogId, { [field]: todayStr });
  };

  const addBill = () => {
    if (!newBill.description || !newBill.amount) return;
    setBills([...bills, { ...newBill, id: Date.now(), paid: false }]);
    setNewBill({ description: '', amount: '', dueDate: '' });
    setShowAddBill(false);
  };

  const toggleBillPaid = (id) => {
    setBills(bills.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  };

  const deleteBill = (id) => {
    setBills(bills.filter(b => b.id !== id));
  };

  const exportData = () => {
    const data = { dogs, bills, companyInfo };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dog-medication-data.json';
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.dogs) setDogs(data.dogs);
        if (data.bills) setBills(data.bills);
        if (data.companyInfo) setCompanyInfo(data.companyInfo);
      } catch (err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const getAlerts = () => {
    const alerts = [];
    dogs.forEach(dog => {
      const nexgardDays = getDaysUntilDue(dog.nexgardLast, MEDICATIONS.nexgard.intervalDays);
      const drontalDays = getDaysUntilDue(dog.drontalLast, MEDICATIONS.drontal.intervalDays);

      if (nexgardDays !== null && nexgardDays <= 7) {
        alerts.push({ dog: dog.name, med: 'Nexgard', days: nexgardDays, type: 'medication' });
      }
      if (drontalDays !== null && drontalDays <= 7) {
        alerts.push({ dog: dog.name, med: 'Drontal', days: drontalDays, type: 'medication' });
      }
    });

    bills.filter(b => !b.paid).forEach(bill => {
      const daysUntil = getDaysUntilDue(bill.dueDate, 0);
      if (daysUntil !== null && daysUntil <= 7) {
        alerts.push({ description: bill.description, days: daysUntil, type: 'bill' });
      }
    });

    return alerts.sort((a, b) => a.days - b.days);
  };

  const generateInvoice = () => {
    const unpaidBills = bills.filter(b => !b.paid);
    const total = unpaidBills.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

    const invoiceContent = `
INVOICE
========================================
Date: ${new Date().toLocaleDateString()}
Invoice #: INV-${Date.now().toString().slice(-6)}

FROM: Office Dog Care
----------------------------------------

TO: ${companyInfo.name || '[Company Name]'}
${companyInfo.address || '[Company Address]'}
${companyInfo.email || '[Company Email]'}

----------------------------------------
ITEMS:
----------------------------------------
${unpaidBills.map(b => `${b.description.padEnd(30)} $${parseFloat(b.amount).toFixed(2)}`).join('\n')}

----------------------------------------
TOTAL: $${total.toFixed(2)}
----------------------------------------

Payment Terms: Due upon receipt
Thank you for your business!
    `.trim();

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const alerts = getAlerts();

  const StatusBadge = ({ daysUntil }) => {
    const color = getStatusColor(daysUntil);
    const colorClasses = {
      red: 'bg-red-100 text-red-800 border-red-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      gray: 'bg-gray-100 text-gray-600 border-gray-300'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
        {getStatusText(daysUntil)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Dog className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Office Dogs Tracker</h1>
                <p className="text-gray-500">Medication & Bill Management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Import</span>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                <Download className="w-4 h-4" />
                <span className="text-sm">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-orange-600" />
              <h2 className="font-semibold text-orange-800">Upcoming & Overdue Items</h2>
            </div>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${alert.days < 0 ? 'bg-red-100' : 'bg-white'}`}>
                  <div className="flex items-center gap-2">
                    {alert.type === 'medication' ? (
                      <Pill className="w-4 h-4 text-purple-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="font-medium">
                      {alert.type === 'medication'
                        ? `${alert.dog} - ${alert.med}`
                        : alert.description}
                    </span>
                  </div>
                  <StatusBadge daysUntil={alert.days} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('medications')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'medications'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Pill className="w-5 h-5" />
            Medications
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'bills'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Bills
          </button>
        </div>

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="space-y-4">
            {dogs.map(dog => (
              <div key={dog.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Dog className="w-6 h-6 text-amber-600" />
                    </div>
                    {editingDog === dog.id ? (
                      <input
                        type="text"
                        value={dog.name}
                        onChange={(e) => setDogs(dogs.map(d => d.id === dog.id ? {...d, name: e.target.value} : d))}
                        className="text-xl font-bold border-b-2 border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <h3 className="text-xl font-bold text-gray-800">{dog.name}</h3>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingDog === dog.id ? (
                      <>
                        <button onClick={() => setEditingDog(null)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => setEditingDog(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditingDog(dog.id)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteDog(dog.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Nexgard Card */}
                  <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-blue-800">💊 Nexgard</span>
                      <span className="text-sm text-blue-600">Monthly</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last given:</span>
                        {editingDog === dog.id ? (
                          <input
                            type="date"
                            value={dog.nexgardLast || ''}
                            onChange={(e) => setDogs(dogs.map(d => d.id === dog.id ? {...d, nexgardLast: e.target.value} : d))}
                            className="text-sm border rounded px-2 py-1"
                          />
                        ) : (
                          <span className="text-sm font-medium">{dog.nexgardLast || 'Not set'}</span>
                        )}
                      </div>
                      <StatusBadge daysUntil={getDaysUntilDue(dog.nexgardLast, MEDICATIONS.nexgard.intervalDays)} />
                      <button
                        onClick={() => markGiven(dog.id, 'nexgard')}
                        className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        ✓ Mark as Given Today
                      </button>
                    </div>
                  </div>

                  {/* Drontal Card */}
                  <div className="border-2 border-purple-100 rounded-xl p-4 bg-purple-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-purple-800">💊 Drontal</span>
                      <span className="text-sm text-purple-600">Every 3 months</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last given:</span>
                        {editingDog === dog.id ? (
                          <input
                            type="date"
                            value={dog.drontalLast || ''}
                            onChange={(e) => setDogs(dogs.map(d => d.id === dog.id ? {...d, drontalLast: e.target.value} : d))}
                            className="text-sm border rounded px-2 py-1"
                          />
                        ) : (
                          <span className="text-sm font-medium">{dog.drontalLast || 'Not set'}</span>
                        )}
                      </div>
                      <StatusBadge daysUntil={getDaysUntilDue(dog.drontalLast, MEDICATIONS.drontal.intervalDays)} />
                      <button
                        onClick={() => markGiven(dog.id, 'drontal')}
                        className="w-full mt-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      >
                        ✓ Mark as Given Today
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Dog Form */}
            {showAddDog ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold mb-4">Add New Dog</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Dog's name"
                    value={newDog.name}
                    onChange={(e) => setNewDog({...newDog, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Last Nexgard</label>
                      <input
                        type="date"
                        value={newDog.nexgardLast}
                        onChange={(e) => setNewDog({...newDog, nexgardLast: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Last Drontal</label>
                      <input
                        type="date"
                        value={newDog.drontalLast}
                        onChange={(e) => setNewDog({...newDog, drontalLast: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addDog} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Add Dog
                    </button>
                    <button onClick={() => setShowAddDog(false)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddDog(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Add New Dog
              </button>
            )}
          </div>
        )}

        {/* Bills Tab */}
        {activeTab === 'bills' && (
          <div className="space-y-4">
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold">Company Information (for invoices)</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Bills List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Bills to Pay</h3>
                <button
                  onClick={generateInvoice}
                  disabled={bills.filter(b => !b.paid).length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  Generate Invoice
                </button>
              </div>

              {bills.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bills added yet</p>
              ) : (
                <div className="space-y-2">
                  {bills.map(bill => (
                    <div key={bill.id} className={`flex items-center justify-between p-4 rounded-xl border ${bill.paid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleBillPaid(bill.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${bill.paid ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                        >
                          {bill.paid && <Check className="w-4 h-4 text-white" />}
                        </button>
                        <div>
                          <p className={`font-medium ${bill.paid ? 'line-through text-gray-400' : ''}`}>{bill.description}</p>
                          <p className="text-sm text-gray-500">Due: {bill.dueDate || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">${parseFloat(bill.amount).toFixed(2)}</span>
                        {!bill.paid && <StatusBadge daysUntil={getDaysUntilDue(bill.dueDate, 0)} />}
                        <button onClick={() => deleteBill(bill.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Bill Form */}
              {showAddBill ? (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={newBill.description}
                      onChange={(e) => setNewBill({...newBill, description: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={newBill.dueDate}
                      onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addBill} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                      Add Bill
                    </button>
                    <button onClick={() => setShowAddBill(false)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddBill(true)}
                  className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-600 transition flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add New Bill
                </button>
              )}
            </div>

            {/* Summary */}
            {bills.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">{bills.length}</p>
                    <p className="text-purple-100">Total Bills</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">${bills.filter(b => !b.paid).reduce((sum, b) => sum + parseFloat(b.amount || 0), 0).toFixed(2)}</p>
                    <p className="text-purple-100">Unpaid</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">${bills.filter(b => b.paid).reduce((sum, b) => sum + parseFloat(b.amount || 0), 0).toFixed(2)}</p>
                    <p className="text-purple-100">Paid</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>💡 Tip: Use Export to save your data, Import to restore it later</p>
        </div>
      </div>
    </div>
  );
}
