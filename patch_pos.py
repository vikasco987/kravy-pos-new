import re

with open("src/app/dashboard/settings/pos/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
content = content.replace(
    'import { kravy } from "@/lib/sounds";',
    'import { kravy } from "@/lib/sounds";\nimport { useProfileCache } from "@/hooks/useProfileCache";'
)

# Replace state and loading logic
old_state = """    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        posCashEnabled: true,
        posUpiEnabled: true,
        posCardEnabled: true,
        posCounterEnabled: true,
        posWalletEnabled: true,
        posHoldEnabled: true,
        posSaveEnabled: true,
        posPreviewEnabled: true,
        posKotEnabled: true,
        expiryTrackingEnabled: true,
        allowWalletEditDelete: true,
        enableVirtualGroupVariants: true,
    });"""

new_state = """    const { profile: cachedProfile, loading: profileLoading, updateProfile } = useProfileCache();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        posCashEnabled: true,
        posUpiEnabled: true,
        posCardEnabled: true,
        posCounterEnabled: true,
        posWalletEnabled: true,
        posHoldEnabled: true,
        posSaveEnabled: true,
        posPreviewEnabled: true,
        posKotEnabled: true,
        expiryTrackingEnabled: true,
        allowWalletEditDelete: true,
        enableVirtualGroupVariants: true,
    });
    const loading = profileLoading && !cachedProfile;"""

content = content.replace(old_state, new_state)

# Replace useEffect and fetchProfile
old_fetch = """    useEffect(() => {
        fetch(`/api/profile`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setSettings({
                        posCashEnabled: data.posCashEnabled ?? true,
                        posUpiEnabled: data.posUpiEnabled ?? true,
                        posCardEnabled: data.posCardEnabled ?? true,
                        posCounterEnabled: data.posCounterEnabled ?? true,
                        posWalletEnabled: data.posWalletEnabled ?? true,
                        posHoldEnabled: data.posHoldEnabled ?? true,
                        posSaveEnabled: data.posSaveEnabled ?? true,
                        posPreviewEnabled: data.posPreviewEnabled ?? true,
                        posKotEnabled: data.posKotEnabled ?? true,
                        expiryTrackingEnabled: data.expiryTrackingEnabled ?? false,
                        allowWalletEditDelete: data.printSettings?.allowWalletEditDelete ?? data.allowWalletEditDelete ?? true,
                        enableVirtualGroupVariants: data.printSettings?.enableVirtualGroupVariants ?? data.enableVirtualGroupVariants ?? true,
                    });
                }
            })
            .catch(() => toast.error("Failed to load settings"))
            .finally(() => setLoading(false));
    }, []);"""

new_fetch = """    useEffect(() => {
        if (cachedProfile) {
            setSettings({
                posCashEnabled: cachedProfile.posCashEnabled ?? true,
                posUpiEnabled: cachedProfile.posUpiEnabled ?? true,
                posCardEnabled: cachedProfile.posCardEnabled ?? true,
                posCounterEnabled: cachedProfile.posCounterEnabled ?? true,
                posWalletEnabled: cachedProfile.posWalletEnabled ?? true,
                posHoldEnabled: cachedProfile.posHoldEnabled ?? true,
                posSaveEnabled: cachedProfile.posSaveEnabled ?? true,
                posPreviewEnabled: cachedProfile.posPreviewEnabled ?? true,
                posKotEnabled: cachedProfile.posKotEnabled ?? true,
                expiryTrackingEnabled: cachedProfile.expiryTrackingEnabled ?? false,
                allowWalletEditDelete: cachedProfile.printSettings?.allowWalletEditDelete ?? cachedProfile.allowWalletEditDelete ?? true,
                enableVirtualGroupVariants: cachedProfile.printSettings?.enableVirtualGroupVariants ?? cachedProfile.enableVirtualGroupVariants ?? true,
            });
        }
    }, [cachedProfile]);"""

content = content.replace(old_fetch, new_fetch)

# Update handleSave to call updateProfile
old_save_success = """            if (res.ok) {
                kravy.success();
                toast.success("POS layout updated");
            } else {"""

new_save_success = """            if (res.ok) {
                updateProfile(settings);
                kravy.success();
                toast.success("POS layout updated");
            } else {"""

content = content.replace(old_save_success, new_save_success)

with open("src/app/dashboard/settings/pos/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched POS Page")
