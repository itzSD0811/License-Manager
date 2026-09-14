"use client";

import { useState, useEffect } from "react";
import { User, Mail, Box, Calendar } from "lucide-react";
import { createLicense } from "@/app/actions/license";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function CreateLicenseForm({ products, onClose }: { products: any[], onClose: () => void }) {
  const [email, setEmail] = useState("");
  
  const [productId, setProductId] = useState(products.length > 0 ? products[0].id : "");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [countryRegion, setCountryRegion] = useState("");
  
  const [rateLimit, setRateLimit] = useState("");
  const [rateLimitWindow, setRateLimitWindow] = useState("days");
  const [isRateLimitWindowOpen, setIsRateLimitWindowOpen] = useState(false);

  const [expireYears, setExpireYears] = useState("");
  const [expireMonths, setExpireMonths] = useState("");
  const [expireDays, setExpireDays] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  const isValid = email !== "" && productId !== "" && customerName.trim() !== "" && customerEmail.trim() !== "";
  const selectedProductName = products.find(p => p.id === productId)?.name || "Select Product";

  return (
    <form action={async (formData) => {
      await createLicense(formData);
      onClose();
    }} className="space-y-6">
      <input type="hidden" name="builderEmail" value={email} />
      <input type="hidden" name="productId" value={productId} />
      
      <div className="space-y-1">
        <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
          Select Product
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 z-10">
            <Box className="h-4 w-4 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsProductDropdownOpen(!isProductDropdownOpen);
            }}
            className={`block w-full text-left rounded-2xl border-0 pl-11 pr-10 py-3.5 text-gray-900 font-medium transition-all sm:text-sm ${
              isProductDropdownOpen ? "bg-white ring-2 ring-primary" : "bg-[var(--bg-app)] hover:bg-gray-100"
            }`}
          >
            {selectedProductName}
          </button>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 z-10">
            <svg className={`h-4 w-4 text-gray-400 transition-transform ${isProductDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {isProductDropdownOpen && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {products.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 font-medium">No products available</div>
              )}
              {products.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProductId(p.id);
                    setIsProductDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-medium transition-colors ${
                    productId === p.id ? "bg-[var(--bg-app)] text-primary font-bold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="customerName" className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
          Customer Name
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            name="customerName"
            id="customerName"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] pl-11 pr-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="customerEmail" className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
          Customer Email
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="email"
            name="customerEmail"
            id="customerEmail"
            required
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] pl-11 pr-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="space-y-1 flex-1">
          <label htmlFor="countryRegion" className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
            Country / Region
          </label>
          <div className="relative">
            <input
              type="text"
              name="countryRegion"
              id="countryRegion"
              value={countryRegion}
              onChange={(e) => setCountryRegion(e.target.value)}
              className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
              placeholder="e.g. United States"
            />
          </div>
        </div>

        <div className="space-y-1 flex-1">
          <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
            Rate Limit (Optional)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                name="rateLimit"
                min="1"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
                placeholder="Hits"
              />
            </div>
            
            <div className="relative w-[110px]">
              <input type="hidden" name="rateLimitWindow" value={rateLimitWindow} />
              <button
                type="button"
                onClick={() => setIsRateLimitWindowOpen(!isRateLimitWindowOpen)}
                className={`block w-full text-left rounded-2xl border-0 px-4 py-3.5 text-gray-900 font-medium transition-all sm:text-sm ${
                  isRateLimitWindowOpen ? "bg-white ring-2 ring-primary" : "bg-[var(--bg-app)] hover:bg-gray-100"
                }`}
              >
                / {rateLimitWindow}
              </button>
              
              {isRateLimitWindowOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {["days", "hours"].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setRateLimitWindow(opt);
                        setIsRateLimitWindowOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        rateLimitWindow === opt ? "bg-[var(--bg-app)] text-primary font-bold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      / {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="space-y-1 w-full">
          <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
            Expiration Duration (Optional)
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                name="expireYears"
                min="0"
                value={expireYears}
                onChange={(e) => setExpireYears(e.target.value)}
                className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
                placeholder="Years"
              />
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                name="expireMonths"
                min="0"
                value={expireMonths}
                onChange={(e) => setExpireMonths(e.target.value)}
                className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
                placeholder="Months"
              />
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                name="expireDays"
                min="0"
                value={expireDays}
                onChange={(e) => setExpireDays(e.target.value)}
                className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
                placeholder="Days"
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              name="startAtActivation" 
              id="startAtActivation"
              value="true"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="startAtActivation" className="text-xs font-medium text-gray-500 cursor-pointer select-none">
              Start count down when on first activation
            </label>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!isValid}
          className="flex w-full justify-center items-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold text-white shadow-md transition-all disabled:opacity-50 disabled:bg-[#989bf3] disabled:cursor-not-allowed bg-primary hover:bg-[#4a46c6]"
        >
          {email ? "Generate License Key" : "Loading..."}
        </button>
      </div>
    </form>
  );
}
