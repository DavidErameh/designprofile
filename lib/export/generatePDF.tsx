import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer';
import { DesignProfile } from '../../types/profile';
import { generateExports } from '../analysis/exports';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#0A0A0A' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#0066FF' },
  subtitle: { fontSize: 14, color: '#737373', marginBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 30, marginBottom: 15, borderBottom: '1px solid #E5E5E5', paddingBottom: 5 },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 150, color: '#737373' },
  value: { flex: 1, fontWeight: 'bold' },
  swatchContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  swatch: { width: 80, marginBottom: 15 },
  colorBox: { width: 80, height: 40, borderRadius: 4, marginBottom: 5 },
  swatchText: { fontSize: 10, color: '#737373' },
  codeBlock: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 4, fontFamily: 'Courier', fontSize: 9, marginTop: 10 }
});

const ReportPDF = ({ profile }: { profile: DesignProfile }) => {
  const exports = generateExports(profile);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>DesignProfiler Report</Text>
        <Text style={styles.subtitle}>Source: {profile.source_value}</Text>
        <Text style={{ fontSize: 12, color: '#737373', marginBottom: 40 }}>
          Analyzed: {new Date(profile.analyzed_at).toLocaleString()}
        </Text>
        
        <Text style={styles.sectionTitle}>Design DNA Scores</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Visual Hierarchy:</Text>
          <Text style={styles.value}>{profile.meta.quality_scores?.visual_hierarchy ?? 0}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Accessibility:</Text>
          <Text style={styles.value}>{profile.meta.quality_scores?.accessibility ?? 0}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Brand Consistency:</Text>
          <Text style={styles.value}>{profile.meta.quality_scores?.brand_consistency ?? 0}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Modernity:</Text>
          <Text style={styles.value}>{profile.meta.quality_scores?.modernity ?? 0}%</Text>
        </View>
      </Page>
      
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Color Palette</Text>
        <View style={styles.swatchContainer}>
          {profile.colors.palette.map((color, i) => (
            <View key={i} style={styles.swatch}>
              <View style={[styles.colorBox, { backgroundColor: color.hex }]} />
              <Text style={styles.swatchText}>{color.hex}</Text>
              <Text style={styles.swatchText}>{color.role}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Typography</Text>
        {profile.typography.fonts.map((f, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.label}>{f.role}:</Text>
            <Text style={styles.value}>{f.family}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Spacing Scale</Text>
        {profile.spacing.scale.map((s, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.label}>{s.label}:</Text>
            <Text style={styles.value}>{s.value}px</Text>
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Export Formats</Text>
        
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>CSS Variables</Text>
        <View style={styles.codeBlock}>
          <Text>{exports.css_variables}</Text>
        </View>
        
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 5 }}>Tailwind Config</Text>
        <View style={styles.codeBlock}>
          <Text>{exports.tailwind_config}</Text>
        </View>
        
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 5 }}>SCSS Variables</Text>
        <View style={styles.codeBlock}>
          <Text>{exports.scss_variables}</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generatePDFBuffer = async (profile: DesignProfile): Promise<Buffer> => {
  const stream = await renderToStream(<ReportPDF profile={profile} />);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    // @ts-ignore
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    // @ts-ignore
    stream.on('error', (err) => reject(err));
    // @ts-ignore
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};
