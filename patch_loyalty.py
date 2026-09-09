import re

with open("src/app/dashboard/settings/loyalty/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
content = content.replace(
    'import { toast } from "sonner";',
    'import { toast } from "sonner";\nimport { useProfileCache } from "@/hooks/useProfileCache";'
)

# Replace state and loading logic
old_state = """  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    enableLoyaltyProgram: true,
    loyaltyPointRatio: 10,
    loyaltyMinOrderAmount: 100,
    loyaltyValueInRupees: 1,
    loyaltyMinRedeem: 100,
    maxRedeemPointsPerBill: 500
  });"""

new_state = """  const { profile: cachedProfile, loading: profileLoading, updateProfile } = useProfileCache();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    enableLoyaltyProgram: true,
    loyaltyPointRatio: 10,
    loyaltyMinOrderAmount: 100,
    loyaltyValueInRupees: 1,
    loyaltyMinRedeem: 100,
    maxRedeemPointsPerBill: 500
  });

  const loading = profileLoading && !cachedProfile;

  useEffect(() => {
    if (cachedProfile) {
      setProfile({
        enableLoyaltyProgram: cachedProfile.enableLoyaltyProgram !== false,
        loyaltyPointRatio: cachedProfile.loyaltyPointRatio ?? 10,
        loyaltyMinOrderAmount: cachedProfile.loyaltyMinOrderAmount ?? 100,
        loyaltyValueInRupees: cachedProfile.loyaltyValueInRupees ?? 1,
        loyaltyMinRedeem: cachedProfile.loyaltyMinRedeem ?? 100,
        maxRedeemPointsPerBill: cachedProfile.maxRedeemPointsPerBill ?? 500
      });
    }
  }, [cachedProfile]);"""

content = content.replace(old_state, new_state)

# Replace useEffect and fetchProfile
old_fetch = """  useEffect(() => {
    fetchProfile();
    fetchParties();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          enableLoyaltyProgram: data.enableLoyaltyProgram !== false,
          loyaltyPointRatio: data.loyaltyPointRatio ?? 10,
          loyaltyMinOrderAmount: data.loyaltyMinOrderAmount ?? 100,
          loyaltyValueInRupees: data.loyaltyValueInRupees ?? 1,
          loyaltyMinRedeem: data.loyaltyMinRedeem ?? 100,
          maxRedeemPointsPerBill: data.maxRedeemPointsPerBill ?? 500
        });
      }
    } catch (err) {
      toast.error("Failed to load profile settings");
    } finally {
      setLoading(false);
    }
  };"""

new_fetch = """  useEffect(() => {
    fetchParties();
  }, []);"""

content = content.replace(old_fetch, new_fetch)

# Update handleSave to call updateProfile
old_save_success = """      if (res.ok) {
        toast.success("Loyalty & Rewards rules updated successfully! 👑");
      } else {"""

new_save_success = """      if (res.ok) {
        updateProfile({
          enableLoyaltyProgram: profile.enableLoyaltyProgram,
          loyaltyPointRatio: parseFloat(profile.loyaltyPointRatio) || 10,
          loyaltyMinOrderAmount: parseFloat(profile.loyaltyMinOrderAmount) || 0,
          loyaltyValueInRupees: parseFloat(profile.loyaltyValueInRupees) || 1,
          loyaltyMinRedeem: parseInt(profile.loyaltyMinRedeem) || 100,
          maxRedeemPointsPerBill: parseInt(profile.maxRedeemPointsPerBill) || 500
        });
        toast.success("Loyalty & Rewards rules updated successfully! 👑");
      } else {"""

content = content.replace(old_save_success, new_save_success)

with open("src/app/dashboard/settings/loyalty/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched Loyalty Page")
