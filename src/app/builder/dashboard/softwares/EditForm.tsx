"use client";

import { useState } from "react";
import { Globe, KeyRound } from "lucide-react";
import { updateProduct } from "@/app/actions/product";

export function EditProductForm({ product, onClose }: { product: any, onClose: () => void }) {
  const [name, setName] = useState(product.name || "");
  const [githubRepo, setGithubRepo] = useState(product.githubRepo || "");
  const [githubToken, setGithubToken] = useState(product.githubToken || "");
  const [isPrivate, setIsPrivate] = useState(!!product.githubToken);
  const [rsaAction, setRsaAction] = useState("none");

  const isValid = name.trim() !== "" && githubRepo.trim() !== "";

  return (
    <form action={async (formData) => {
      await updateProduct(formData);
      onClose();
    }} className="space-y-6">
      <input type="hidden" name="id" value={product.id} />
      
      <div className="space-y-1">
        <label htmlFor="edit-name" className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
          Friendly Name
        </label>
        <input
          type="text"
          name="name"
          id="edit-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
          placeholder="e.g. Hosting Billing Pro"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="edit-githubRepo" className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
          GitHub Repo (Owner/Repo)
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Globe className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            name="githubRepo"
            id="edit-githubRepo"
            required
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] pl-11 pr-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
            placeholder="myusername/my-project"
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={isPrivate}
              onChange={(e) => {
                setIsPrivate(e.target.checked);
                if (!e.target.checked) setGithubToken("");
              }}
              className="peer sr-only" 
            />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
          <span className="text-sm font-bold text-gray-700 select-none">Private Repository</span>
        </label>

        {isPrivate && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <label htmlFor="edit-githubToken" className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase">
              GitHub Token (Required for Private Repos)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <KeyRound className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="githubToken"
                id="edit-githubToken"
                required={isPrivate}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] pl-11 pr-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-sm"
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          Ironclad Security Layer (RSA Payload Signing)
        </label>
        
        {product.rsaPublicKey && (
          <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-green-700 font-bold flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  RSA Keys Active
                </p>
                <p className="text-[11px] text-green-600 font-medium">This product has an active RSA keypair for signing payloads.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([product.rsaPublicKey], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${product.name.replace(/\s+/g, '_')}_public.pem`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs font-bold text-green-700 hover:text-green-800 bg-green-200/50 hover:bg-green-200 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
              >
                <KeyRound className="w-3 h-3" /> Download .pem
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="rsaAction" 
              value="none" 
              checked={rsaAction === "none"} 
              onChange={() => setRsaAction("none")} 
              className="text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-sm font-medium text-gray-700">Keep Existing (Do nothing)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="rsaAction" 
              value="generate" 
              checked={rsaAction === "generate"} 
              onChange={() => setRsaAction("generate")} 
              className="text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-sm font-medium text-gray-700">Regenerate 2048-bit RSA Keypair</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="radio" 
              name="rsaAction" 
              value="paste" 
              checked={rsaAction === "paste"} 
              onChange={() => setRsaAction("paste")} 
              className="text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-sm font-medium text-gray-700">Paste new PEM Private Key</span>
          </label>

          {rsaAction === "paste" && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <textarea
                name="pastedPrivateKey"
                rows={4}
                className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all sm:text-xs font-mono"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!isValid}
          className="flex w-full justify-center items-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold text-white shadow-md transition-all disabled:opacity-50 disabled:bg-[#989bf3] disabled:cursor-not-allowed bg-primary hover:bg-[#4a46c6]"
        >
          Update Software Profile
        </button>
      </div>
    </form>
  );
}
