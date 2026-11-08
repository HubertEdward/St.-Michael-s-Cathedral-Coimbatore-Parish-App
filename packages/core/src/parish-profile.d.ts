// The profile of the parish the app is built for. Metro resolves this module to
// parishes/<PARISH>/index.ts (see parishes/select.js); every profile satisfies ParishProfile.
declare module '@parish/profile' {
  const profile: import('./profile').ParishProfile;
  export default profile;
}
