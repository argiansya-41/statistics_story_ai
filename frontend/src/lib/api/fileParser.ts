import type { ColumnInfo, DatasetSummary } from "@/lib/types/analysis";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ROW_COUNT = 10000;

export interface ValidationIssue {
  field?: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * Parsing teks CSV yang aman dan menangani kutipan ("..."), koma, maupun titik koma (;).
 */
export function parseCSVText(csvText: string): { headers: string[]; rows: Record<string, string | number>[] } {
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error("File CSV kosong");
  }

  // Deteksi pemisah (koma atau titik koma)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h, i) => (h ? h : `kolom_${i + 1}`));

  const rows: Record<string, string | number>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const values = parseLine(lines[r]);
    // Skip empty lines
    if (values.length === 1 && values[0] === "") continue;
    const rowObj: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const valStr = values[i] !== undefined ? values[i] : "";
      // Cek apakah numerik
      const num = Number(valStr.replace(",", "."));
      if (valStr !== "" && !isNaN(num) && isFinite(num)) {
        rowObj[h] = num;
      } else {
        rowObj[h] = valStr;
      }
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Menganalisis tipe data kolom dan nilai unik
 */
export function analyzeColumns(headers: string[], rows: Record<string, string | number>[]): ColumnInfo[] {
  return headers.map((header) => {
    let numericCount = 0;
    let nonNumericCount = 0;
    const distinctSet = new Set<string>();
    const samples: (string | number)[] = [];

    rows.forEach((row) => {
      const v = row[header];
      if (v !== undefined && v !== null && v !== "") {
        distinctSet.add(String(v));
        if (typeof v === "number" || (!isNaN(Number(v)) && isFinite(Number(v)))) {
          numericCount++;
        } else {
          nonNumericCount++;
        }
        if (samples.length < 5) samples.push(v);
      }
    });

    const isNumeric = numericCount > 0 && nonNumericCount === 0;
    const isCategorical = distinctSet.size <= 20 && !isNumeric;

    return {
      name: header,
      type: isNumeric ? "numeric" : isCategorical ? "categorical" : "text",
      sampleValues: samples,
      distinctCount: distinctSet.size,
    };
  });
}

/**
 * Parsing file (CSV atau Excel) dari input File browser.
 */
export async function parseUploadedFile(file: File): Promise<DatasetSummary> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Ukuran file melebihi batas maksimal 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  const name = file.name.toLowerCase();
  const isCSV = name.endsWith(".csv");
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

  if (!isCSV && !isExcel) {
    throw new Error("Format file tidak didukung. Harap upload file berekstensi .csv, .xlsx, atau .xls");
  }

  if (isCSV) {
    const text = await file.text();
    const { headers, rows } = parseCSVText(text);

    if (rows.length === 0) {
      throw new Error("File CSV tidak memiliki baris data (dataset kosong)");
    }
    if (rows.length > MAX_ROW_COUNT) {
      throw new Error(`Jumlah baris data (${rows.length}) melebihi batas maksimal 10.000 baris`);
    }

    const kolomInfo = analyzeColumns(headers, rows);

    return {
      nama_file: file.name,
      nama_dataset: file.name.replace(/\.[^/.]+$/, ""),
      format_data: "csv",
      sumber_input: "mentah",
      total_baris: rows.length,
      total_kolom: headers.length,
      kolom: headers,
      kolom_info: kolomInfo,
      preview_baris: rows.slice(0, 10),
      data_mentah: rows,
    };
  }

  // Penanganan Excel (.xlsx / .xls)
  // Ekstrak teks/xml jika memungkinkan, atau jika binary Excel dikirim ke backend
  try {
    const buffer = await file.arrayBuffer();
    // Cek header zip untuk XLSX (PK\x03\x04)
    const headerBytes = new Uint8Array(buffer.slice(0, 4));
    const isZip = headerBytes[0] === 0x50 && headerBytes[1] === 0x4b;

    if (!isZip && name.endsWith(".xlsx")) {
      throw new Error("File .xlsx tidak valid atau rusak.");
    }

    // Parsing XLSX sederhana berbasis dekompresi XML atau fallback tabular
    const rows = await parseXLSXBuffer(buffer);
    if (!rows || rows.length === 0) {
      throw new Error("File Excel terbaca kosong atau sheet tidak berisi data numerik.");
    }

    const headers = Object.keys(rows[0]);
    const kolomInfo = analyzeColumns(headers, rows);

    return {
      nama_file: file.name,
      nama_dataset: file.name.replace(/\.[^/.]+$/, ""),
      format_data: "excel",
      sumber_input: "mentah",
      total_baris: rows.length,
      total_kolom: headers.length,
      kolom: headers,
      kolom_info: kolomInfo,
      preview_baris: rows.slice(0, 10),
      data_mentah: rows,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membaca berkas Excel";
    throw new Error(msg);
  }
}

/**
 * Parser ringan untuk XLSX dalam lingkungan browser
 */
async function parseXLSXBuffer(buffer: ArrayBuffer): Promise<Record<string, string | number>[]> {
  // Parsing ZIP manual sederhana untuk mencari worksheet1.xml & sharedStrings.xml
  // Jika browser mendukung fflate atau DecompressionStream, gunakan stream decompression.
  try {
    const entries = await readZipEntries(buffer);
    const sharedStringsXml = entries["xl/sharedstrings.xml"] || entries["xl/sharedStrings.xml"] || "";
    const sheetXml =
      entries["xl/worksheets/sheet1.xml"] ||
      entries["xl/worksheets/sheet.xml"] ||
      Object.keys(entries).find((k) => k.startsWith("xl/worksheets/"))
        ? entries[Object.keys(entries).find((k) => k.startsWith("xl/worksheets/"))!]
        : "";

    if (!sheetXml) {
      throw new Error("Tidak menemukan worksheet di berkas Excel");
    }

    // Parse shared strings
    const sharedStrings: string[] = [];
    if (sharedStringsXml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sharedStringsXml, "application/xml");
      const siNodes = doc.querySelectorAll("si");
      siNodes.forEach((si) => {
        const tNodes = si.querySelectorAll("t");
        let txt = "";
        tNodes.forEach((t) => (txt += t.textContent || ""));
        sharedStrings.push(txt);
      });
    }

    // Parse sheet XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(sheetXml, "application/xml");
    const rowNodes = doc.querySelectorAll("row");

    const matrix: (string | number)[][] = [];

    rowNodes.forEach((rowNode) => {
      const cNodes = rowNode.querySelectorAll("c");
      const rowData: (string | number)[] = [];

      cNodes.forEach((c) => {
        const type = c.getAttribute("t");
        const vNode = c.querySelector("v");
        const rawVal = vNode ? vNode.textContent || "" : "";

        if (type === "s") {
          // shared string
          const idx = parseInt(rawVal, 10);
          rowData.push(sharedStrings[idx] ?? "");
        } else if (type === "b") {
          rowData.push(rawVal === "1" ? "TRUE" : "FALSE");
        } else {
          const num = Number(rawVal);
          if (rawVal !== "" && !isNaN(num) && isFinite(num)) {
            rowData.push(num);
          } else {
            rowData.push(rawVal);
          }
        }
      });

      if (rowData.some((v) => v !== "")) {
        matrix.push(rowData);
      }
    });

    if (matrix.length < 2) {
      throw new Error("Sheet Excel minimal memerlukan header dan setidaknya satu baris data");
    }

    const headers = matrix[0].map((h, i) => String(h || `kolom_${i + 1}`).trim());
    const resultRows: Record<string, string | number>[] = [];

    for (let r = 1; r < matrix.length; r++) {
      const row = matrix[r];
      const obj: Record<string, string | number> = {};
      headers.forEach((h, c) => {
        obj[h] = row[c] !== undefined ? row[c] : "";
      });
      resultRows.push(obj);
    }

    return resultRows;
  } catch {
    // Jika format XLS lama (BIFF8) atau binary khusus, sediakan fallback ramah
    throw new Error(
      "Format berkas Excel tidak dapat di-parse langsung di browser. Untuk kompatibilitas optimal, simpan berkas sebagai format .CSV atau .XLSX standar."
    );
  }
}

/**
 * Pembaca ZIP ringan berbasis standard Web API
 */
async function readZipEntries(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const entries: Record<string, string> = {};

  let offset = 0;
  while (offset < bytes.length - 30) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break; // Bukan local file header

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);

    const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes).toLowerCase();

    const dataStart = offset + 30 + fileNameLength + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (
      fileName.endsWith(".xml") &&
      (fileName.includes("sharedstrings") || fileName.includes("worksheets/"))
    ) {
      const compressedData = bytes.subarray(dataStart, dataEnd);

      if (compressionMethod === 0) {
        // Uncompressed (stored)
        entries[fileName] = new TextDecoder().decode(compressedData);
      } else if (compressionMethod === 8 && typeof DecompressionStream !== "undefined") {
        // Deflate
        try {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(compressedData as unknown as BufferSource);
          writer.close();
          const response = new Response(ds.readable);
          const decompressedText = await response.text();
          entries[fileName] = decompressedText;
        } catch {
          // ignore individual entry error
        }
      }
    }

    offset = dataEnd;
  }

  return entries;
}
