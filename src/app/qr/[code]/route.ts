import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { code: string } }) {
    try {
        const { code } = params;

        // Find the QR code and its associated business profile
        const qr = await prisma.googleReviewQR.findUnique({
            where: { code },
            include: {
                businessProfile: true
            }
        });

        if (!qr) {
            return new NextResponse(`
                <html>
                    <head><title>QR Not Found</title></head>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h2>QR Code Not Found</h2>
                        <p>The QR code you scanned is invalid or has been deleted.</p>
                    </body>
                </html>
            `, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        // Increment scan count asynchronously
        prisma.googleReviewQR.update({
            where: { id: qr.id },
            data: { scanCount: { increment: 1 } }
        }).catch(err => console.error("Failed to increment QR scan count:", err));

        const reviewUrl = qr.businessProfile?.googleReviewUrl;

        if (!reviewUrl) {
            // Fallback page requested by the user
            return new NextResponse(`
                <html>
                    <head>
                        <title>Review Link Not Configured</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; color: #374151;">
                        <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #111827; margin-bottom: 16px;">Link Not Configured</h2>
                            <p style="line-height: 1.5; color: #4B5563;">
                                <strong>Google Review link is not configured yet.</strong><br/><br/>
                                Please contact the business owner.
                            </p>
                        </div>
                    </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }

        // Redirect to the Google Review URL
        return NextResponse.redirect(reviewUrl);
    } catch (error) {
        console.error("Error in Google Review QR redirect:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
