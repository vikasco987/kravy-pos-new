import re

with open("src/app/dashboard/settings/printing/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
content = content.replace(
    'import { kravy } from "@/lib/sounds";',
    'import { kravy } from "@/lib/sounds";\nimport { useProfileCache } from "@/hooks/useProfileCache";'
)

# Replace state and loading logic
old_state = """export default function PrintingSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [business, setBusiness] = useState<any>(null);"""

new_state = """export default function PrintingSettings() {
    const { profile: cachedProfile, loading: profileLoading, updateProfile } = useProfileCache();
    const [saving, setSaving] = useState(false);
    const [business, setBusiness] = useState<any>(null);
    const loading = profileLoading && !cachedProfile;"""

content = content.replace(old_state, new_state)

# Replace useEffect and fetchProfile
old_fetch = """    useEffect(() => {
        fetch(`/api/profile`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setBusiness(data);
                    const merged = {
                        ...defaults,
                        ...(data.printSettings || {})
                    };
                    setPrintSettings(merged);
                    setOriginalSettings(merged);
                }
            })
            .catch(() => toast.error("Failed to load settings"))
            .finally(() => setLoading(false));
    }, []);"""

new_fetch = """    useEffect(() => {
        if (cachedProfile) {
            setBusiness(cachedProfile);
            const merged = {
                ...defaults,
                ...(cachedProfile.printSettings || {})
            };
            setPrintSettings(merged);
            setOriginalSettings(merged);
        }
    }, [cachedProfile]);"""

content = content.replace(old_fetch, new_fetch)

# Update handleSave to call updateProfile
old_save_success = """            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setBusiness(data);
                    const merged = {
                        ...defaults,
                        ...(data.printSettings || {})
                    };
                    setPrintSettings(merged);
                    setOriginalSettings(merged);
                } else {
                    setOriginalSettings(printSettings);
                }
                kravy.success();
                toast.success("Printing preferences saved!");
            } else {"""

new_save_success = """            if (res.ok) {
                const data = await res.json();
                if (data) {
                    updateProfile(data);
                    setBusiness(data);
                    const merged = {
                        ...defaults,
                        ...(data.printSettings || {})
                    };
                    setPrintSettings(merged);
                    setOriginalSettings(merged);
                } else {
                    updateProfile({ printSettings });
                    setOriginalSettings(printSettings);
                }
                kravy.success();
                toast.success("Printing preferences saved!");
            } else {"""

content = content.replace(old_save_success, new_save_success)

with open("src/app/dashboard/settings/printing/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched Printing Page")
