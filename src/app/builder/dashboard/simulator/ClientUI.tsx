"use client";

import { useState, useEffect } from "react";
import { Terminal, Play, ShieldCheck, Cpu, RefreshCw, Download, ChevronRight } from "lucide-react";

export default function SimulatorClientUI({ licenses }: { licenses: any[] }) {
  const [action, setAction] = useState("VALIDATE");
  const [key, setKey] = useState(licenses.length > 0 ? licenses[0].key : "");
  
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // Auto-clear response when changing actions
  useEffect(() => {
    setResponse(null);
  }, [action, key]);

  const getEndpoint = () => {
    switch (action) {
      case "VALIDATE": return "/api/v1/license/validate";
      case "ACTIVATE": return "/api/v1/license/activate";
      case "UPDATE": return "/api/v1/license/update"; // Placeholder for future
      case "DOWNLOAD": return "/api/v1/license/download"; // Placeholder for future
      default: return "";
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      // We hardcode a dummy simulator hardware ID behind the scenes
      // so the user doesn't have to type it manually for testing.
      const payload: any = {
        key,
        installationId: "SIMULATOR-TEST-ENV",
        os: "Simulator OS",
        appVersion: "1.0.0"
      };

      if (action === "DOWNLOAD") {
        payload.Relesename = "v1.0.0";
      }

      const res = await fetch(getEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      // Inject HTTP status artificially so we can display it if we wanted to
      setResponse({
        _status: res.status,
        ...data
      });
    } catch (err: any) {
      setResponse({ _status: 500, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const [currentUrl, setCurrentUrl] = useState("https://magneticx.com");
  useEffect(() => {
    setCurrentUrl(window.location.origin);
  }, []);

  const curlCommand = `curl -X POST "${currentUrl}${getEndpoint()}" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "${key || "..."}", "installationId": "SIMULATOR-TEST-ENV"${action === "DOWNLOAD" ? `, "Relesename": "v1.0.0"` : ""}}'`;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (API Tester + Curl) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live API Tester Card */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Live API Tester</h2>
                <p className="text-sm text-gray-500 font-medium">Verify your cloud endpoints in real-time.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-2">
                  License Key (Required)
                </label>
                <input 
                  type="text" 
                  value={key} 
                  onChange={(e) => setKey(e.target.value)}
                  className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-5 py-4 text-gray-900 font-bold font-mono focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm placeholder:text-gray-300 placeholder:font-medium"
                  placeholder="MX-ABCDEFGHIJKLMNOPQRSTUVWX"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mb-2">
                  Request Action
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => setAction("VALIDATE")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border ${
                      action === "VALIDATE" ? "border-primary bg-blue-50/50 text-primary" : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wider">VALIDATE</span>
                  </button>
                  <button 
                    onClick={() => setAction("ACTIVATE")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border ${
                      action === "ACTIVATE" ? "border-primary bg-blue-50/50 text-primary" : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <Cpu className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wider">ACTIVATE</span>
                  </button>
                  <button 
                    onClick={() => setAction("UPDATE")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border ${
                      action === "UPDATE" ? "border-primary bg-blue-50/50 text-primary" : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wider">UPDATE</span>
                  </button>
                  <button 
                    onClick={() => setAction("DOWNLOAD")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border ${
                      action === "DOWNLOAD" ? "border-primary bg-blue-50/50 text-primary" : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-wider">DOWNLOAD</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleTest}
                disabled={isLoading || !key}
                className="w-full flex items-center justify-center gap-2 bg-[#9b99ea] text-white px-5 py-4 rounded-2xl text-sm font-black tracking-wide hover:bg-primary transition-all disabled:opacity-50 mt-4"
              >
                {isLoading ? "Executing..." : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Execute API Call
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Developer Console Card */}
          <div className="bg-[#0f172a] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>
              </div>
              <span className="ml-4 text-[10px] font-bold text-gray-500 tracking-[0.2em]">DEVELOPER CONSOLE</span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-blue-300 whitespace-pre-wrap break-all">
              {curlCommand}
            </pre>
          </div>

        </div>

        {/* Right Column (Live Response) */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[700px] h-full relative overflow-hidden">
          <div className="flex items-center gap-2 p-8 pb-4 border-b border-gray-50">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Live Response</h3>
          </div>

          <div className="flex-1 p-8 overflow-auto relative">
            {response ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase ${
                    response._status >= 200 && response._status < 300 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}>
                    HTTP {response._status}
                  </span>
                </div>
                <pre className="font-mono text-[13px] text-gray-600 leading-relaxed">
                  {JSON.stringify(
                    Object.keys(response)
                      .filter(k => k !== '_status')
                      .reduce((obj, key) => ({ ...obj, [key]: response[key] }), {}), 
                    null, 2
                  )}
                </pre>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
                <Terminal className="w-24 h-24 mb-6 opacity-50" strokeWidth={1} />
                <p className="font-black tracking-[0.2em] text-sm text-gray-300 uppercase">Waiting for request...</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* API Documentation Section */}
      <div className="mt-12 bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">API Documentation</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Integrate these endpoints into your software clients.</p>
        </div>
        
        <div className="p-8 space-y-12">
          
          {/* Activate */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-100 text-green-700 font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider">POST</span>
              <h3 className="text-lg font-bold text-gray-900">/api/v1/license/activate</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Binds a license key to a specific machine/hardware ID. If enabled, this will also start the countdown timer for the license expiration.</p>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto mb-4">
              <pre className="text-blue-300 text-[13px] font-mono whitespace-pre">
{`{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "installationId": "HWID-123456",
  "os": "Windows 11",       // optional
  "appVersion": "1.0.0"     // optional
}`}
              </pre>
            </div>
          </div>

          {/* Validate */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-100 text-green-700 font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider">POST</span>
              <h3 className="text-lg font-bold text-gray-900">/api/v1/license/validate</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Verifies that the license is active, not expired, and bound to the correct hardware ID. Call this on app startup.</p>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto mb-4">
              <pre className="text-blue-300 text-[13px] font-mono whitespace-pre">
{`{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "installationId": "HWID-123456"
}`}
              </pre>
            </div>
          </div>

          {/* Update */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-100 text-green-700 font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider">POST</span>
              <h3 className="text-lg font-bold text-gray-900">/api/v1/license/update</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Checks the linked GitHub repository for the absolute latest release and returns the tag name and markdown release notes.</p>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto mb-4">
              <pre className="text-blue-300 text-[13px] font-mono whitespace-pre">
{`{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "installationId": "HWID-123456"
}`}
              </pre>
            </div>
          </div>

          {/* Download */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-100 text-green-700 font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider">POST</span>
              <h3 className="text-lg font-bold text-gray-900">/api/v1/license/download</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Securely streams the GitHub release asset directly to the client. Can be used in a browser form POST or raw cURL with <code>--output</code>.</p>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto mb-4">
              <pre className="text-blue-300 text-[13px] font-mono whitespace-pre">
{`{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "installationId": "HWID-123456",
  "Relesename": "v1.0.0"    // optional, defaults to latest
}`}
              </pre>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <div className="text-amber-600 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Testing with cURL?</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  If you test this endpoint in a terminal using <code>curl</code>, you will get a warning: <strong>"Warning: Binary output can mess up your terminal."</strong>
                  <br className="mb-1" />
                  Because this endpoint streams the raw compiled asset (like a .zip or .exe), you must append the <code>--output filename.zip</code> flag to your cURL command to save the file to your disk instead of printing it to the console!
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6">Troubleshooting & Error Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <span className="text-red-600 font-black text-sm bg-red-100 px-2 py-1 rounded mb-3 inline-block">403 Forbidden</span>
                <p className="text-xs text-gray-600 font-bold mb-1">HOST_MISMATCH</p>
                <p className="text-xs text-gray-500">The <code>installationId</code> does not match the hardware ID this license was originally activated on.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <span className="text-red-600 font-black text-sm bg-red-100 px-2 py-1 rounded mb-3 inline-block">403 Forbidden</span>
                <p className="text-xs text-gray-600 font-bold mb-1">LICENSE_DISABLED / LICENSE_EXPIRED</p>
                <p className="text-xs text-gray-500">The license was manually frozen/disabled by the builder, or the expiration date has passed.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <span className="text-orange-600 font-black text-sm bg-orange-100 px-2 py-1 rounded mb-3 inline-block">429 Too Many Requests</span>
                <p className="text-xs text-gray-600 font-bold mb-1">RATE_LIMIT_EXCEEDED</p>
                <p className="text-xs text-gray-500">The client has made too many API calls within their configured window limit. Must wait for reset.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <span className="text-gray-600 font-black text-sm bg-gray-200 px-2 py-1 rounded mb-3 inline-block">404 Not Found</span>
                <p className="text-xs text-gray-600 font-bold mb-1">INVALID_KEY</p>
                <p className="text-xs text-gray-500">The provided license key does not exist in the database.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
