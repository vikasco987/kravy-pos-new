import re

with open("src/app/dashboard/settings/advanced/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the fetching logic
content = content.replace(
    'import { toast } from "react-hot-toast";',
    'import { toast } from "react-hot-toast";\nimport { useProfileCache } from "@/hooks/useProfileCache";'
)

# Replace the state and useEffect
old_logic = """  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, []);"""

new_logic = """  const [saving, setSaving] = useState(false);
  const { profile, loading, updateProfile } = useProfileCache();"""

content = content.replace(old_logic, new_logic)

# Replace the setProfile on save
content = content.replace("setProfile({ ...profile, ...updatedFields });", "updateProfile(updatedFields);")

with open("src/app/dashboard/settings/advanced/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
