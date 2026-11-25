'use client';

import React from 'react';
import { DashboardTemplate } from '@/components/templates/dashboard';

/**
 * Main User Dashboard Route Page.
 * Conforms strictly to the Thin Page Invariant (< 20 lines) by delegating presentation to DashboardTemplate.
 */
export default function DashboardPage() {
  return <DashboardTemplate />;
}
