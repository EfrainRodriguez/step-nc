import { describe, expect, it } from 'vitest';
import { parseP21 } from '../../src/parser/parser';

describe('parseP21 — full document', () => {
  it('parses minimal valid file', () => {
    const src = [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AUTO'));",
      'ENDSEC;',
      'DATA;',
      'ENDSEC;',
      'END-ISO-10303-21;',
    ].join('\n');

    const { ast, diagnostics } = parseP21(src);

    expect(ast.type).toBe('P21Document');
    expect(ast.header.type).toBe('HeaderSection');
    expect(ast.header.entities).toHaveLength(3);
    expect(ast.data).toHaveLength(1);
    expect(ast.data[0]!.entities).toHaveLength(0);
    expect(ast.anchor).toBeUndefined();
    expect(ast.reference).toBeUndefined();
    expect(ast.signatures).toHaveLength(0);
    expect(diagnostics).toHaveLength(0);
  });

  it('parses header + data with entities', () => {
    const src = [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AUTO'));",
      'ENDSEC;',
      'DATA;',
      '#1=CPT(0.0,0.0,0.0);',
      '#2=CPT(1.0,0.0,0.0);',
      '#3=VX(#1);',
      'ENDSEC;',
      'END-ISO-10303-21;',
    ].join('\n');

    const { ast, diagnostics } = parseP21(src);
    expect(ast.data[0]!.entities).toHaveLength(3);
    expect(diagnostics).toHaveLength(0);
  });

  it('parses multiple data sections', () => {
    const src = [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AUTO'));",
      'ENDSEC;',
      'DATA;',
      '#1=CPT(0.0,0.0,0.0);',
      'ENDSEC;',
      'DATA;',
      '#100=VX(#1);',
      'ENDSEC;',
      'END-ISO-10303-21;',
    ].join('\n');

    const { ast } = parseP21(src);
    expect(ast.data).toHaveLength(2);
    expect(ast.data[0]!.entities).toHaveLength(1);
    expect(ast.data[1]!.entities).toHaveLength(1);
  });

  it('parses distributed file with anchor, reference, signature', () => {
    const src = [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('distributed','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));",
      'ENDSEC;',
      'ANCHOR;',
      '<POINT_1> = #1;',
      'ENDSEC;',
      'REFERENCE;',
      '#11 = <ftp://ftp.acme.net/second_file.stp#vertex_1>;',
      'ENDSEC;',
      'DATA;',
      '#1=CPT(0.0,0.0,0.0);',
      'ENDSEC;',
      'END-ISO-10303-21;',
      'SIGNATURE base64content ENDSEC;',
    ].join('\n');

    const { ast, diagnostics } = parseP21(src);
    expect(ast.anchor).toBeDefined();
    expect(ast.anchor!.anchors).toHaveLength(1);
    expect(ast.reference).toBeDefined();
    expect(ast.reference!.references).toHaveLength(1);
    expect(ast.data).toHaveLength(1);
    expect(ast.signatures).toHaveLength(1);
    expect(diagnostics).toHaveLength(0);
  });

  it('reports missing ISO-10303-21 preamble', () => {
    const src = [
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AUTO'));",
      'ENDSEC;',
      'DATA;',
      'ENDSEC;',
      'END-ISO-10303-21;',
    ].join('\n');

    const { diagnostics } = parseP21(src);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some((d) => d.code === 'P21P060')).toBe(true);
  });

  it('reports missing END-ISO-10303-21', () => {
    const src = [
      'ISO-10303-21;',
      'HEADER;',
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('test','2024-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AUTO'));",
      'ENDSEC;',
      'DATA;',
      'ENDSEC;',
    ].join('\n');

    const { diagnostics } = parseP21(src);
    expect(diagnostics.some((d) => d.code === 'P21P062')).toBe(true);
  });
});
