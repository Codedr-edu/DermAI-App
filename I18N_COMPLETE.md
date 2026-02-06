# I18n Implementation Complete

## What was done:
1.  **Libraries Installed**: `i18next`, `react-i18next`, `expo-localization`.
2.  **Locale Files Created**:
    -   `vi.json`: Full Vietnamese translations including 35 diseases.
    -   `en.json`: English translations.
3.  **Configuration**: `i18n/index.ts` setup to detect device language.
4.  **UI Updates**: `OfflineMode.tsx` refactored to use dynamic translations.

## How to Test:
Reload the app. It should automatically match your device language.
-   Vietnamese Device -> Vietnamese UI
-   English Device -> English UI
