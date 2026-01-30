import BusinessProfileForm from "../_components/BusinessProfileForm";

export default function Page() {
  return (
    <BusinessProfileForm
      mode="create"
      redirectOnSuccess="/profile"
    />
  );
}
