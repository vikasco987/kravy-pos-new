import re

with open("src/app/dashboard/settings/tax/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'import { kravy } from "@/lib/sounds";',
    'import { kravy } from "@/lib/sounds";\nimport { useProfileCache } from "@/hooks/useProfileCache";'
)

old_logic = """    const [offers, setOffers] = useState<Offer[]>([]);
    const [offersLoading, setOffersLoading] = useState(true);

    // New offer form"""

new_logic = """    const { profile: cachedProfile, loading: profileLoading, updateProfile } = useProfileCache();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [offersLoading, setOffersLoading] = useState(true);

    // Populate data quickly when cache is available
    useEffect(() => {
        if (cachedProfile && loading) {
            setBusinessProfile(cachedProfile);
            setTaxEnabled(cachedProfile?.taxEnabled ?? true);
            setPerProductTaxEnabled(cachedProfile?.perProductTaxEnabled ?? false);
            setTaxInclusive(cachedProfile?.taxInclusive ?? false);
            setQrMenuPriceInclusive(cachedProfile?.qrMenuPriceInclusive ?? false);
            setEnableDeliveryCharges(cachedProfile?.enableDeliveryCharges ?? false);
            setDeliveryChargeAmount(cachedProfile?.deliveryChargeAmount ?? 0);
            setEnablePackagingCharges(cachedProfile?.enablePackagingCharges ?? false);
            setPackagingChargeAmount(cachedProfile?.packagingChargeAmount ?? 0);
            setDeliveryGstEnabled(cachedProfile?.deliveryGstEnabled ?? false);
            setDeliveryGstRate(cachedProfile?.deliveryGstRate ?? 0);
            setPackagingGstEnabled(cachedProfile?.packagingGstEnabled ?? false);
            setPackagingGstRate(cachedProfile?.packagingGstRate ?? 0);
            setSyncQuickPosWithKitchen(cachedProfile?.syncQuickPosWithKitchen ?? false);
            setEnableKOTWithBill(cachedProfile?.enableKOTWithBill ?? false);
            setEnableMenuQRInBill(cachedProfile?.enableMenuQRInBill ?? false);
            setTaxRate(cachedProfile?.taxRate ?? 5.0);
            if (!profileLoading) setLoading(false);
        }
    }, [cachedProfile, profileLoading]);

    // New offer form"""

content = content.replace(old_logic, new_logic)

# In the fetchAll function, replace the profile logic
fetch_all_old = """            try {
                const [profileRes, offerRes] = await Promise.all([
                    fetch(`/api/profile`, { cache: "no-store" }),
                    fetch(`/api/admin/offers`, { cache: "no-store" }),
                ]);
                const profileData = await profileRes.json();
                const offerData = await offerRes.json();
                setBusinessProfile(profileData);
                setTaxEnabled(profileData?.taxEnabled ?? true);
                setPerProductTaxEnabled(profileData?.perProductTaxEnabled ?? false);
                setTaxInclusive(profileData?.taxInclusive ?? false);
                setQrMenuPriceInclusive(profileData?.qrMenuPriceInclusive ?? false);
                setEnableDeliveryCharges(profileData?.enableDeliveryCharges ?? false);
                setDeliveryChargeAmount(profileData?.deliveryChargeAmount ?? 0);
                setEnablePackagingCharges(profileData?.enablePackagingCharges ?? false);
                setPackagingChargeAmount(profileData?.packagingChargeAmount ?? 0);

                setDeliveryGstEnabled(profileData?.deliveryGstEnabled ?? false);
                setDeliveryGstRate(profileData?.deliveryGstRate ?? 0);
                setPackagingGstEnabled(profileData?.packagingGstEnabled ?? false);
                setPackagingGstRate(profileData?.packagingGstRate ?? 0);
                setSyncQuickPosWithKitchen(profileData?.syncQuickPosWithKitchen ?? false);
                setEnableKOTWithBill(profileData?.enableKOTWithBill ?? false);
                setEnableMenuQRInBill(profileData?.enableMenuQRInBill ?? false);

                setTaxRate(profileData?.taxRate ?? 5.0);
                setOffers(Array.isArray(offerData) ? offerData : []);
            } catch {"""

fetch_all_new = """            try {
                const offerRes = await fetch(`/api/admin/offers`, { cache: "no-store" });
                const offerData = await offerRes.json();
                setOffers(Array.isArray(offerData) ? offerData : []);
            } catch {"""

content = content.replace(fetch_all_old, fetch_all_new)

# Since loading logic is altered, we should change `if (loading)` to `if (loading && offersLoading)` 
# actually, offersLoading is what blocks the UI now. Let's make the UI render even if offers are loading.
# So change `if (loading) {` to `if (loading) {` (already there, but it will be false much faster).

# We need to update updateProfile inside handleToggleKOT and handleToggleMenuQR
content = content.replace(
    'setBusinessProfile(data);',
    'setBusinessProfile(data);\n                updateProfile(data);'
)

with open("src/app/dashboard/settings/tax/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched Tax page")
