import { read, change, id } from './supportService.js';
export const getTrainingAvailability = params => read('/api/training/availability', params);
export const getTrainerCandidates = (horseId, trainingType) => read('/api/training/trainer-candidates', { horseId, trainingType });
export const getTrainingProfile = staffId => read('/api/staff/' + id(staffId) + '/training-profile');
export const saveTrainingProfile = (staffId, data) => change('/api/staff/' + id(staffId) + '/training-profile', data, 'put');
export const getPublicReferenceData = () => read('/api/training/reference-data');
