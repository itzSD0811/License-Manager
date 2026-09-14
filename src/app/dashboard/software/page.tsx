export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { DownloadCloud, Tag, Calendar, Archive, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const prisma = new PrismaClient();

async function getReleases(repo: string, token: string | null) {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Magneticx-Dev-Panel"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    method: "GET",
    headers,
    cache: "no-store"
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function SoftwarePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("customer_session")?.value;

  if (!session) redirect("/login");

  const license = await prisma.license.findUnique({
    where: { id: session },
    include: { product: true }
  });

  if (!license) redirect("/login");

  const { githubRepo, githubToken } = license.product;
  let releases: any[] = [];
  let errorMsg = null;

  if (!githubRepo) {
    errorMsg = "No software repository is currently linked to your product.";
  } else {
    const { decryptString } = await import("@/lib/encryption");
    releases = await getReleases(githubRepo, githubToken ? decryptString(githubToken) : null);
    if (!Array.isArray(releases)) {
      releases = [];
      errorMsg = "Failed to fetch software releases. The repository might be private or unavailable.";
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Releases & Software</h1>
        <p className="text-sm text-gray-500 font-medium">Download the latest software builds and view changelogs.</p>
      </div>

      {errorMsg ? (
        <div className="bg-red-50 rounded-3xl p-8 border border-red-100 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Repository Unavailable</h3>
          <p className="text-sm text-gray-600">{errorMsg}</p>
        </div>
      ) : releases.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
          <Archive className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Releases Found</h3>
          <p className="text-sm text-gray-500">There are no published releases in this repository yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {releases.map((release: any, idx: number) => {
            const isLatest = idx === 0;
            return (
              <div key={release.id} className={`bg-white rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ${isLatest ? 'border-blue-200' : 'border-gray-100'}`}>
                <div className={`p-6 border-b ${isLatest ? 'bg-blue-50/50 border-blue-100' : 'border-gray-50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">{release.name || release.tag_name}</h2>
                        {isLatest && (
                          <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                            Latest
                          </span>
                        )}
                        {release.prerelease && (
                          <span className="bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                            Pre-release
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {release.tag_name}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(release.published_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Security note: The client calls our proxy download endpoint using their license key,
                        so they don't need the direct asset URL or github token on the frontend. */}
                    <div className="shrink-0 flex flex-col gap-2">
                      {/* Download button removed per user request */}
                    </div>
                  </div>
                </div>
                
                {release.body && (
                  <div className="p-6">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-gray-600 leading-relaxed text-sm" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-sm text-gray-600 marker:text-gray-400" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-sm text-gray-600" {...props} />,
                        li: ({node, ...props}) => <li {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                        code: ({node, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '')
                          const isInline = !match && !className?.includes('language-');
                          return isInline ? (
                            <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <div className="my-4 rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                              <div className="bg-gray-800/50 px-4 py-2 flex items-center border-b border-gray-700/50">
                                <span className="text-xs font-mono text-gray-400">{match?.[1] || 'code'}</span>
                              </div>
                              <pre className="p-4 overflow-x-auto">
                                <code className="text-[13px] font-mono text-gray-300" {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          )
                        }
                      }}
                    >
                      {release.body}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

