import { describe, expect, it } from 'vitest';
import { serializeHeader } from '../../src/serialize-header';

describe('serializeHeader', () => {
  it('should generate header with all fields configured', () => {
    const header = serializeHeader(
      {
        description: ['Sample file', 'for testing'],
        implementationLevel: '2;1',
        fileName: 'test.stp',
        timestamp: '2025-01-15T10:30:00',
        author: ['John Doe'],
        organization: ['ACME Inc.'],
        preprocessorVersion: 'p21-writer v0.1',
        originatingSystem: 'step-nc',
        authorization: 'none',
        schemas: ['MY_SCHEMA'],
      },
      'DEFAULT_SCHEMA',
    );

    expect(header).toContain('HEADER;');
    expect(header).toContain(
      "FILE_DESCRIPTION(('Sample file','for testing'),'2;1');",
    );
    expect(header).toContain("'test.stp'");
    expect(header).toContain("'2025-01-15T10:30:00'");
    expect(header).toContain("('John Doe')");
    expect(header).toContain("('ACME Inc.')");
    expect(header).toContain("'p21-writer v0.1'");
    expect(header).toContain("'step-nc'");
    expect(header).toContain("'none'");
    expect(header).toContain("FILE_SCHEMA(('MY_SCHEMA'));");
    expect(header).toContain('ENDSEC;');
  });

  it('should generate header with defaults', () => {
    const header = serializeHeader(undefined, 'TEST_GEOMETRY');

    expect(header).toContain('HEADER;');
    expect(header).toContain("FILE_DESCRIPTION((''),'2;1');");
    expect(header).toContain("FILE_SCHEMA(('TEST_GEOMETRY'));");
    expect(header).toContain('ENDSEC;');
    // Default timestamp should be ISO format
    expect(header).toMatch(/'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'/);
  });

  it('should use schema name from options when provided', () => {
    const header = serializeHeader(
      { schemas: ['AUTOMOTIVE_DESIGN { 1 0 10303 214 2 1 1}'] },
      'FALLBACK_SCHEMA',
    );

    expect(header).toContain(
      "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 2 1 1}'));",
    );
  });

  it('should support multiple schemas', () => {
    const header = serializeHeader(
      { schemas: ['SCHEMA_A', 'SCHEMA_B'] },
      'DEFAULT',
    );

    expect(header).toContain("FILE_SCHEMA(('SCHEMA_A','SCHEMA_B'));");
  });

  it('should escape special characters in strings', () => {
    const header = serializeHeader(
      {
        description: ["it's a test"],
        author: ['O\\Brien'],
      },
      'TEST',
    );

    expect(header).toContain("'it''s a test'");
    expect(header).toContain("'O\\\\Brien'");
  });

  it('should produce correct structure order', () => {
    const header = serializeHeader(undefined, 'TEST');
    const lines = header.split('\n');

    expect(lines[0]).toBe('HEADER;');
    expect(lines[1]).toMatch(/^FILE_DESCRIPTION/);
    expect(lines[2]).toMatch(/^FILE_NAME/);
    expect(lines[3]).toMatch(/^FILE_SCHEMA/);
    expect(lines[4]).toBe('ENDSEC;');
  });
});
