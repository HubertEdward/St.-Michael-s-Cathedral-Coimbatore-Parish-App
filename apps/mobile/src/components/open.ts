import { parish } from '@parish/core';
import { Linking } from 'react-native';

export const callOffice = () => Linking.openURL(`tel:${parish.phone}`);
export const openDirections = () => Linking.openURL(parish.mapsUrl);
export const emailOffice = () => Linking.openURL(`mailto:${parish.email}`);
export const openWebsite = () => parish.website && Linking.openURL(parish.website);
