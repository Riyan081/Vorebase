"use client";

import { IconCode } from "@/lib/icons";

/**
 * MySQL-relevant database features instead of PostgreSQL extensions.
 * Since Vorebase uses MySQL 8.0, we show MySQL-specific capabilities.
 */
const mysqlFeatures = [
  {
    id: "json",
    name: "JSON Support",
    version: "8.0",
    category: "Data Types",
    description: "Native JSON column type with JSON_EXTRACT, JSON_SET, and JSON path expressions for semi-structured data.",
    enabled: true,
  },
  {
    id: "fulltext",
    name: "Full-Text Search",
    version: "8.0",
    category: "Search",
    description: "Built-in full-text indexing and search with MATCH AGAINST for natural language queries.",
    enabled: true,
  },
  {
    id: "uuid",
    name: "UUID Functions",
    version: "8.0",
    category: "Utilities",
    description: "UUID() and UUID_TO_BIN() for generating and storing universally unique identifiers efficiently.",
    enabled: true,
  },
  {
    id: "cte",
    name: "Common Table Expressions",
    version: "8.0",
    category: "Query",
    description: "WITH (CTE) and WITH RECURSIVE for complex hierarchical queries and readable SQL.",
    enabled: true,
  },
  {
    id: "window",
    name: "Window Functions",
    version: "8.0",
    category: "Query",
    description: "ROW_NUMBER(), RANK(), LAG(), LEAD(), and other analytic functions for advanced data analysis.",
    enabled: true,
  },
  {
    id: "spatial",
    name: "Spatial (GIS)",
    version: "8.0",
    category: "Geospatial",
    description: "Native spatial data types (POINT, POLYGON) and functions (ST_Distance, ST_Contains) for location-based queries.",
    enabled: false,
  },
  {
    id: "roles",
    name: "Database Roles",
    version: "8.0",
    category: "Security",
    description: "MySQL role-based access control. Vorebase uses application-level roles (anon, authenticated, service_role) instead.",
    enabled: false,
  },
  {
    id: "charset",
    name: "utf8mb4 Character Set",
    version: "8.0",
    category: "Encoding",
    description: "Full Unicode support including emoji characters. All Vorebase project databases use utf8mb4_unicode_ci by default.",
    enabled: true,
  },
];

function FeatureRow({
  feature,
}: {
  feature: (typeof mysqlFeatures)[number];
}) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-bg-secondary hover:border-border-light transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-sm font-bold font-mono text-text-primary">{feature.name}</code>
          <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary font-mono">
            MySQL {feature.version}
          </span>
          <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary">
            {feature.category}
          </span>
        </div>
        <p className="text-sm text-text-secondary">{feature.description}</p>
      </div>
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
          feature.enabled
            ? "bg-success-muted text-success"
            : "bg-bg-tertiary text-text-muted"
        }`}
      >
        {feature.enabled ? "Available" : "Not used"}
      </span>
    </div>
  );
}

export default function ExtensionsView() {
  return (
    <>
      <div className="p-4 rounded-xl border border-accent/20 bg-accent-muted/10 mb-6">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-accent">MySQL 8.0 Features</span> — Vorebase uses MySQL 8.0
          as the database engine. Below are the built-in features available to your project databases.
        </p>
      </div>

      <div className="space-y-3">
        {mysqlFeatures.map((feature) => (
          <FeatureRow key={feature.id} feature={feature} />
        ))}
      </div>
    </>
  );
}
