import re

auth_file = "src/app/auth/custom/page.tsx"
staff_file = "src/app/staff/login/page.tsx"

auth_hook = """  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const errorStr = urlParams.get("error");
      if (errorStr === "session_expired") {
        toast.error("Your session has expired. Please login again to continue.");
        // Clean URL without refreshing page
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (errorStr) {
        toast.error(errorStr);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);"""

# Add to auth/custom/page.tsx
with open(auth_file, "r", encoding="utf-8") as f:
    content = f.read()

if "session_expired" not in content:
    content = content.replace("  const router = useRouter();\n", f"  const router = useRouter();\n\n{auth_hook}\n")
    # Make sure useEffect is imported
    if "useEffect" not in content.split("import React")[1].split("}")[0]:
        content = content.replace("import React, { useState }", "import React, { useState, useEffect }")
    with open(auth_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated auth page")

# Add to staff/login/page.tsx
with open(staff_file, "r", encoding="utf-8") as f:
    content2 = f.read()

if "session_expired" not in content2:
    content2 = content2.replace("  const router = useRouter();\n", f"  const router = useRouter();\n\n{auth_hook}\n")
    if "useEffect" not in content2.split("import React")[1].split("}")[0]:
        content2 = content2.replace("import React, { useState }", "import React, { useState, useEffect }")
    with open(staff_file, "w", encoding="utf-8") as f:
        f.write(content2)
    print("Updated staff page")
