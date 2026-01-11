// Page type enum for type safety
export var PageType;
(function (PageType) {
    PageType["PROFILE"] = "profile";
    PageType["COMPANY"] = "company";
    PageType["OTHER"] = "other"; // non-LinkedIn or unsupported pages
})(PageType || (PageType = {}));
// Type guard for profile data
export function isProfileData(data) {
    return 'fullName' in data && 'linkedinCompanyPage' in data;
}
// Type guard for company data
export function isCompanyData(data) {
    return 'companyName' in data;
}
//# sourceMappingURL=types.js.map