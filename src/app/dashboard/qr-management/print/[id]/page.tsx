"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { kravy } from "@/lib/sounds";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function PrintQRDesignPage() {
    const params = useParams();
    const router = useRouter();
    const tableId = params.id as string;
    
    const [table, setTable] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTable = async () => {
            try {
                const res = await fetch("/api/tables");
                if (res.ok) {
                    const tables = await res.json();
                    const foundTable = tables.find((t: any) => t.id === tableId);
                    if (foundTable) {
                        setTable(foundTable);
                    } else {
                        toast.error("Table not found");
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTable();
    }, [tableId]);

    // Automatically trigger print when loaded
    useEffect(() => {
        if (!loading && table) {
            // Short delay to ensure image loads before printing
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, table]);

    if (loading) return <div className="p-10 text-center">Loading design...</div>;
    if (!table) return <div className="p-10 text-center">Table not found</div>;

    return (
        <>
            <div className="no-print p-4 bg-gray-100 flex justify-between items-center shadow-sm">
                <Button variant="outline" onClick={() => window.close()}>Close</Button>
                <Button onClick={() => window.print()}>Print Design</Button>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;0,900;1,700&family=Work+Sans:wght@400;500;600&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    background: #0e0906;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    font-family: 'Work Sans', sans-serif;
                }
                
                @media print {
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }

                .card {
                    width: 620px;
                    background: linear-gradient(180deg, #1c130d 0%, #140d09 55%, #0f0906 100%);
                    border-radius: 28px;
                    padding: 56px 48px 44px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 40px 80px rgba(0,0,0,0.55);
                    margin: 0 auto;
                }

                .card::before {
                    content: "";
                    position: absolute;
                    top: -180px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 700px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(226,96,31,0.35) 0%, rgba(226,96,31,0) 70%);
                    pointer-events: none;
                    z-index: 0;
                }

                .card-inner {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                }

                .logo {
                    width: 140px;
                    margin: 0 auto 32px;
                    display: block;
                }

                .title {
                    font-family: 'Fraunces', serif;
                    font-size: 52px;
                    font-weight: 700;
                    color: #fff;
                    line-height: 1.1;
                    margin-bottom: 24px;
                    letter-spacing: -0.02em;
                }

                .title span {
                    color: #e2601f;
                    font-style: italic;
                }

                .subtitle {
                    color: #a3958c;
                    font-size: 20px;
                    font-weight: 500;
                    margin-bottom: 48px;
                    letter-spacing: 0.01em;
                }

                .qr-wrap {
                    background: #fff;
                    padding: 16px;
                    border-radius: 24px;
                    display: inline-block;
                    margin-bottom: 40px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }

                .qr-frame {
                    position: relative;
                    border: 1px solid #f0e6e0;
                    border-radius: 12px;
                    padding: 12px;
                }

                #qrcode img {
                    display: block;
                    width: 260px !important;
                    height: 260px !important;
                    border-radius: 4px;
                }

                .qr-logo {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60px;
                    height: 60px;
                    background: #fff;
                    border-radius: 50%;
                    padding: 6px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .qr-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .table-info {
                    background: rgba(226,96,31,0.1);
                    border: 1px solid rgba(226,96,31,0.2);
                    padding: 18px 40px;
                    border-radius: 100px;
                    display: inline-flex;
                    align-items: center;
                    gap: 16px;
                    color: #fff;
                    font-size: 22px;
                    font-weight: 600;
                }

                .table-number {
                    color: #e2601f;
                    font-size: 26px;
                }

                .footer {
                    margin-top: 36px;
                    color: #7a6e65;
                    font-size: 15px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
            `}} />

            <div className="card">
                <div className="card-inner">
                    <img src="/chicken-logo.png" alt="Chicken Extension" className="logo" />
                    
                    <h1 className="title">Scan to<br/><span>Order</span></h1>
                    <p className="subtitle">Skip the wait. Order from your phone.</p>

                    <div className="qr-wrap">
                        <div className="qr-frame">
                            <div id="qrcode">
                                <img src={table.qrUrl} alt="QR Code" />
                            </div>
                            <div className="qr-logo">
                                <img src="/chicken-logo.png" alt="Logo" />
                            </div>
                        </div>
                    </div>

                    <div className="table-info">
                        <span>Table</span>
                        <span className="table-number">{table.name}</span>
                    </div>

                    <p className="footer">Powered by Kravy</p>
                </div>
            </div>
        </>
    );
}
