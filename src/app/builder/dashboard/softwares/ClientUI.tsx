"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Globe, Edit3, Trash2, Loader2, AlertCircle } from "lucide-react";
import { CreateProductForm } from "./ClientForm";
import { EditProductForm } from "./EditForm";
import { deleteProduct } from "@/app/actions/product";
import { getProductReleases } from "@/app/actions/github";

// We receive products from the Server Component
export default function SoftwaresClientUI({ products }: { products: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products.length > 0 ? products[0].id : null);
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null);

  const [releases, setReleases] = useState<any[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Fetch real releases when product changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.githubRepo) {
      setLoadingReleases(true);
      setReleaseError(null);
      getProductReleases(selectedProduct.id).then(res => {
        if (res.error) {
          setReleaseError(res.error);
          setReleases([]);
        } else {
          setReleases(res.releases || []);
        }
        setLoadingReleases(false);
      });
    } else {
      setReleases([]);
      setReleaseError(null);
    }
  }, [selectedProduct?.id, selectedProduct?.githubRepo]);

  const latestRelease = releases.length > 0 ? releases[0] : null;
  const previousReleases = releases.length > 1 ? releases.slice(1) : [];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Software Catalog</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Manage multi-app distribution and GitHub sync.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#4a46c6] transition-colors shadow-[0_4px_14px_0_rgba(90,86,214,0.39)]"
        >
          <Plus className="w-4 h-4" />
          Add New Software
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Panel: Products List */}
        <div className="w-full lg:w-1/3">
          <h3 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
            YOUR PRODUCTS
          </h3>
          <div className="bg-white rounded-3xl border border-gray-100 p-2 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.02)] min-h-[400px]">
            {products.length === 0 ? (
              <div className="h-full flex items-center justify-center pt-32 pb-32">
                <p className="text-sm text-gray-400 font-medium">No softwares configured.</p>
              </div>
            ) : (
              <ul className="space-y-2 p-2">
                {products.map((product) => {
                  const isSelected = selectedProductId === product.id;
                  return (
                    <li key={product.id}>
                      <button 
                        onClick={() => setSelectedProductId(product.id)}
                        className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all group ${
                          isSelected 
                            ? "bg-[var(--bg-app)] border-gray-200 border" 
                            : "bg-gray-50/50 border border-gray-100 hover:bg-[var(--bg-app)] hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                            isSelected ? "bg-white border-gray-200 border" : "bg-white border-gray-100 group-hover:border-gray-200"
                          }`}>
                            <Package className={`w-5 h-5 transition-colors ${isSelected ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
                          </div>
                          <div className="text-left">
                            <p className={`text-[15px] font-bold transition-colors ${isSelected ? "text-primary" : "text-gray-900 group-hover:text-primary"}`}>
                              {product.name}
                            </p>
                            <p className={`text-[12px] font-medium flex items-center gap-1 mt-0.5 transition-colors ${isSelected ? "text-[#8689f1]" : "text-gray-400 group-hover:text-[#8689f1]"}`}>
                              {product.githubRepo || "No GitHub Repo"}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
             )}
          </div>
        </div>

        {/* Right Panel: Empty State / Detail */}
        <div className="w-full lg:w-2/3">
          {!selectedProduct ? (
            <div className="flex flex-col items-center justify-center h-full pt-20">
              <div className="w-24 h-24 bg-[var(--bg-app)] rounded-3xl flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Select a Product</h3>
              <p className="text-gray-500 text-sm font-medium">
                Create or select a software product from the sidebar to manage its releases.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.02)] min-h-[400px]">
              
              {/* Product Header */}
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedProduct.name}</h2>
                  <p className="text-sm text-gray-500 font-medium mt-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    {selectedProduct.githubRepo || "Not linked to GitHub"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors border border-gray-200"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => setProductToDelete(selectedProduct.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-colors border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>

              {/* Releases Section */}
              <div className="space-y-6">
                <h3 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase border-b border-gray-100 pb-3 flex items-center gap-2">
                  Release History & Tags
                  {loadingReleases && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                </h3>
                
                {selectedProduct.githubRepo ? (
                  <>
                    {loadingReleases ? (
                      <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                      </div>
                    ) : releaseError ? (
                      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="text-red-800 font-bold text-sm">Failed to fetch releases</h4>
                          <p className="text-red-600 text-xs mt-1">{releaseError}</p>
                        </div>
                      </div>
                    ) : releases.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-sm text-gray-500 font-medium">No releases found in this repository yet.</p>
                      </div>
                    ) : (
                      <>
                        {/* Latest Release */}
                        {latestRelease && (
                          <div className="bg-[var(--bg-app)] border border-gray-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-primary text-white text-[10px] tracking-wider uppercase font-black rounded-lg">
                                  LATEST
                                </div>
                                <span className="font-mono text-sm font-bold text-gray-900">{latestRelease.tag_name}</span>
                              </div>
                              <span className="text-xs text-gray-400 font-medium">
                                Published {new Date(latestRelease.published_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {latestRelease.body}
                            </div>
                          </div>
                        )}

                        {/* Previous Tags Container */}
                        {previousReleases.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Older Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {previousReleases.map(release => (
                                <button
                                  key={release.id}
                                  onClick={() => setExpandedRelease(expandedRelease === release.tag_name ? null : release.tag_name)}
                                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors border ${
                                    expandedRelease === release.tag_name 
                                      ? "bg-primary text-white border-primary" 
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                                  }`}
                                >
                                  {release.tag_name}
                                </button>
                              ))}
                            </div>

                            {/* Expanded Tag Notes */}
                            {expandedRelease && previousReleases.find(r => r.tag_name === expandedRelease) && (
                              <div className="mt-4 p-5 bg-white border border-gray-200 shadow-sm rounded-xl animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                                  <span className="font-mono text-sm font-bold text-primary">{expandedRelease} Notes</span>
                                  <span className="text-xs text-gray-400 font-medium">
                                    Published {new Date(previousReleases.find(r => r.tag_name === expandedRelease)!.published_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                  {previousReleases.find(r => r.tag_name === expandedRelease)!.body}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Globe className="w-6 h-6 text-gray-400" />
                    </div>
                    <h4 className="text-gray-900 font-bold mb-1">No GitHub Connection</h4>
                    <p className="text-sm text-gray-500 font-medium">Link a GitHub repository to automatically sync release tags and notes.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Software</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <CreateProductForm onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Software</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <EditProductForm product={selectedProduct} onClose={() => setShowEditModal(false)} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Software?</h3>
            <p className="text-gray-500 text-sm font-medium mb-8">
              Are you sure you want to permanently delete this software product? All associated licenses will be destroyed. This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <form 
                action={async (formData) => {
                  await deleteProduct(formData);
                  setProductToDelete(null);
                  setSelectedProductId(null);
                }} 
                className="flex-1"
              >
                <input type="hidden" name="id" value={productToDelete} />
                <button type="submit" className="w-full px-4 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-md">
                  Yes, Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
