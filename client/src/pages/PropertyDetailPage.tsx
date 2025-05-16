import React from 'react';
import { useParams } from 'wouter';
import DynamicPropertyDetail from './properties/detail/[id]';

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams();
  
  if (!id) {
    return <div>Property ID is required</div>;
  }
  
  return <DynamicPropertyDetail />;
};

export default PropertyDetailPage;