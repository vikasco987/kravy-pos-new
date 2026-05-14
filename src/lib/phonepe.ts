import axios from "axios";

const TOKEN_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";
const STATUS_URL = "https://api.phonepe.com/apis/pg/checkout/v2/order";

export async function getAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.PHONEPE_CLIENT_ID || "");
  params.append("client_version", process.env.PHONEPE_CLIENT_VERSION || "");
  params.append("client_secret", process.env.PHONEPE_CLIENT_SECRET || "");

  const res = await axios.post(TOKEN_URL, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return res.data.access_token;
}

/**
 * Checks the status of an order directly from PhonePe
 * @param {string} merchantOrderId 
 * @returns {Promise<{status: string, payload?: any, error?: string}>}
 */
export async function checkPhonePeStatus(merchantOrderId: string) {
  try {
    const token = await getAccessToken();
    const url = `${STATUS_URL}/${process.env.PHONEPE_MERCHANT_ID}/${merchantOrderId}/status`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `O-Bearer ${token}`,
        "Content-Type": "application/json",
        "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
      },
    });

    return {
      status: res.data.state || res.data.payload?.state,
      payload: res.data
    };
  } catch (err: any) {
    console.error("PhonePe Status Check Error:", err.response?.data || err.message);
    return { status: "ERROR", error: err.message };
  }
}
