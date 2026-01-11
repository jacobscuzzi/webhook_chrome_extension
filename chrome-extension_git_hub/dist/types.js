// Type guard for profile data
export function isProfileData(data) {
    return 'fullName' in data && 'linkedinCompanyPage' in data;
}
// Type guard for company data
export function isCompanyData(data) {
    return 'companyName' in data;
}
//# sourceMappingURL=types.js.map