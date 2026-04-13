import AccountSetPage from "../account/AccountSettings";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full">
        <AccountSetPage />
      </div>
    </div>
  );
}
