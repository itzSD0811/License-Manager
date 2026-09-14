"use client";

import { useState } from "react";
import { 
  Plus, Copy, Key, User, CalendarDays, Search, Trash2, 
  Power, Edit3, MonitorX, RefreshCcw, Lock, Unlock,
  Snowflake, Flame, Globe2, Cpu, RotateCcw, AlertTriangle, Pen
} from "lucide-react";
import { CreateLicenseForm } from "./ClientForm";
import { 
  deleteLicense, 
  toggleLicenseStatus, 
  toggleLicenseFreeze, 
  toggleLicenseLock, 
  resetRateLimit, 
  unassignHost,
  renewLicense,
  editLicense
} from "@/app/actions/license";

export default function LicensesClientUI({ licenses, products }: { licenses: any[], products: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [deletingLicense, setDeletingLicense] = useState<any>(null);
  const [renewingLicense, setRenewingLicense] = useState<any>(null);

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLicenses = licenses.filter(l => 
    l.key.toLowerCase().includes(search.toLowerCase()) || 
    l.id.toLowerCase().includes(search.toLowerCase()) || 
    l.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    l.product?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">License Keys</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Manage, generate, and revoke software licenses.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#4a46c6] transition-colors shadow-[0_4px_14px_0_rgba(90,86,214,0.39)]"
        >
          <Plus className="w-4 h-4" />
          Generate License
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-2xl border-0 bg-white pl-11 pr-4 py-3.5 text-gray-900 font-medium shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
          placeholder="Search by key, customer, or product..."
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">License Key & ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Customer</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Product</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Machine Identity</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Expiry</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 tracking-wider uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-[var(--bg-app)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Key className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">No licenses found</p>
                    <p className="text-sm text-gray-400 font-medium">Generate a new license key to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => {
                  const now = new Date();
                  const created = new Date(license.createdAt);
                  const expiry = license.expiresAt ? new Date(license.expiresAt) : null;
                  
                  let expiryStr = "Never";
                  if (expiry) {
                    const diffTime = expiry.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) expiryStr = "Expired";
                    else if (diffDays === 0) expiryStr = "Expires today";
                    else if (diffDays > 365) expiryStr = `${Math.floor(diffDays/365)} years left`;
                    else if (diffDays > 30) expiryStr = `${Math.floor(diffDays/30)} months left`;
                    else expiryStr = `${diffDays} days left`;
                  }

                  const hasInstalls = license.installations && license.installations.length > 0;
                  const firstInstall = hasInstalls ? license.installations[0] : null;

                  return (
                    <tr key={license.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* KEY & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/50">
                            {license.key.substring(0, 8)}********
                          </div>
                          <button 
                            onClick={() => copyToClipboard(license.key)}
                            className="text-gray-400 hover:text-primary transition-colors relative"
                            title="Copy Key"
                          >
                            <Copy className="w-4 h-4" />
                            {copiedKey === license.key && (
                              <span className="absolute left-1/2 -top-8 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-50">Copied!</span>
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {license.id}</p>
                      </td>

                      {/* CUSTOMER */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-app)] flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{license.customer?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium text-gray-400">
                              <span>{license.customer?.email}</span>
                              {license.customer?.countryRegion && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <span className="flex items-center gap-1"><Globe2 className="w-3 h-3" /> {license.customer.countryRegion}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* PRODUCT */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">{license.product?.name}</span>
                        {license.rateLimit && (
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            {license.rateLimitHits}/{license.rateLimit} req/{license.rateLimitWindow}
                          </p>
                        )}
                      </td>

                      {/* MACHINE IDENTITY */}
                      <td className="px-6 py-4">
                        {hasInstalls ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-green-500" />
                              <span className="text-[11px] font-mono font-bold text-gray-900" title={firstInstall.installationId}>
                                HWID: {firstInstall.installationId.length > 12 ? firstInstall.installationId.substring(0, 12) + "..." : firstInstall.installationId}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Globe2 className="w-4 h-4 text-blue-500" />
                              <span className="text-[11px] font-mono font-bold text-gray-900">
                                IP: {firstInstall.ipAddress || "Unknown"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium italic">Unassigned</span>
                        )}
                      </td>

                      {/* EXPIRY */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${expiryStr === "Expired" ? "text-red-500" : "text-gray-900"}`}>
                            {expiryStr}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            Created {created.toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase border ${
                            license.status === "Active" ? "bg-green-50 text-green-600 border-green-200" :
                            license.status === "Not Activated" ? "bg-gray-50 text-gray-500 border-gray-200" :
                            "bg-red-50 text-red-600 border-red-200"
                          }`}>
                            {license.status}
                          </span>
                          
                          <div className="flex gap-1">
                            {license.isFrozen && <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">FROZEN</span>}
                            {license.isLocked && <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">LOCKED</span>}
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          <button onClick={() => setEditingLicense(license)} title="Edit Customer Details" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                            <Pen className="w-4 h-4" />
                          </button>

                          <button onClick={() => setRenewingLicense(license)} title="Renew License" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <CalendarDays className="w-4 h-4" />
                          </button>

                          <form action={toggleLicenseStatus}>
                            <input type="hidden" name="id" value={license.id} />
                            <button type="submit" title={license.status === "Active" ? "Disable" : "Enable"} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                              <Power className="w-4 h-4" />
                            </button>
                          </form>

                          <form action={toggleLicenseFreeze}>
                            <input type="hidden" name="id" value={license.id} />
                            <button type="submit" title={license.isFrozen ? "Unfreeze" : "Freeze"} className={`p-2 rounded-lg transition-colors ${license.isFrozen ? "text-blue-500 bg-blue-50 hover:bg-blue-100" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}>
                              {license.isFrozen ? <Flame className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
                            </button>
                          </form>

                          <form action={toggleLicenseLock}>
                            <input type="hidden" name="id" value={license.id} />
                            <button type="submit" title={license.isLocked ? "Unlock" : "Lock"} className={`p-2 rounded-lg transition-colors ${license.isLocked ? "text-orange-500 bg-orange-50 hover:bg-orange-100" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"}`}>
                              {license.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                          </form>

                          {hasInstalls && (
                            <form action={unassignHost}>
                              <input type="hidden" name="id" value={license.id} />
                              <button type="submit" title="Unassign Host" className="p-2 text-gray-400 hover:text-primary hover:bg-[var(--bg-app)] rounded-lg transition-colors">
                                <MonitorX className="w-4 h-4" />
                              </button>
                            </form>
                          )}

                          <form action={resetRateLimit}>
                            <input type="hidden" name="id" value={license.id} />
                            <button type="submit" title="Reset Rate Limit" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </form>

                          <button onClick={() => setDeletingLicense(license)} title="Delete" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Generate License</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <CreateLicenseForm products={products} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Customer</h3>
              <button onClick={() => setEditingLicense(null)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form action={async (formData) => {
              await editLicense(formData);
              setEditingLicense(null);
            }} className="space-y-4">
              <input type="hidden" name="id" value={editingLicense.id} />
              <div>
                <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Customer Name</label>
                <input type="text" name="customerName" defaultValue={editingLicense.customer?.name} className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Email</label>
                <input type="email" name="customerEmail" defaultValue={editingLicense.customer?.email} className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Country / Region</label>
                <input type="text" name="countryRegion" defaultValue={editingLicense.customer?.countryRegion} className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
              </div>
              <button type="submit" className="w-full bg-primary text-white px-5 py-4 rounded-2xl text-sm font-bold hover:bg-[#4a46c6] transition-colors mt-4">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {renewingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Renew License</h3>
              <button onClick={() => setRenewingLicense(null)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Add duration to the current expiry date.</p>
            <form action={async (formData) => {
              await renewLicense(formData);
              setRenewingLicense(null);
            }} className="space-y-4">
              <input type="hidden" name="id" value={renewingLicense.id} />
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Years</label>
                  <input type="number" name="renewYears" min="0" defaultValue="" className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Months</label>
                  <input type="number" name="renewMonths" min="0" defaultValue="" className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Days</label>
                  <input type="number" name="renewDays" min="0" defaultValue="" className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white px-5 py-4 rounded-2xl text-sm font-bold hover:bg-[#4a46c6] transition-colors mt-4">Confirm Renewal</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete License?</h3>
            <p className="text-sm text-gray-500 mb-8">
              Are you sure you want to completely revoke and delete this license key? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingLicense(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <form action={async (formData) => {
                await deleteLicense(formData);
                setDeletingLicense(null);
              }} className="flex-1">
                <input type="hidden" name="id" value={deletingLicense.id} />
                <button type="submit" className="w-full bg-red-500 text-white px-4 py-3.5 rounded-2xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
