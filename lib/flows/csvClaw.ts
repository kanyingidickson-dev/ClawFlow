import { FlowDefinition, FlowResult } from "../engine/types";

export const csvClaw: FlowDefinition = {
  id: "csv",
  name: "CSV-Claw",
  description: "Parses messy CSV strings into clean, structured JSON arrays",
  example: "id, name , age\n1, John Doe , 28\n 2,Jane Smith,  34 \n3,Bob, \n",
  icon: "📊",
  color: "#10b981", // emerald
  category: "dev",

  execute(input: string): FlowResult {
    const steps: string[] = ["Splitting input by newlines"];
    
    const lines = input.trim().split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return {
        steps: ["Error: Not enough lines for a CSV"],
        result: { error: "CSV needs at least a header row and one data row." }
      };
    }

    steps.push("Extracting and normalizing headers");
    const parseCsvRow = (row: string) => {
      // Improved regex to handle quoted values with commas correctly
      const re = /"([^"]*(?:""[^"]*)*)"|([^,]+)|(?<=,)(?=,)|(?<=^)(?=,)|(?<=,)(?=$)/g;
      const matches = [];
      let m;
      while ((m = re.exec(row)) !== null) {
        if (m.index === re.lastIndex) re.lastIndex++;
        matches.push(m[1] !== undefined ? m[1].replace(/""/g, '"') : (m[2] || "").trim());
      }
      return matches;
    };
    
    const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    
    steps.push(`Detected ${headers.length} columns: ${headers.join(', ')}`);
    
    const data: Record<string, string | number | null>[] = [];
    let emptyCells = 0;
    
    steps.push("Mapping rows to JSON objects");
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvRow(lines[i]);
      const row: Record<string, string | number | null> = {};
      
      headers.forEach((header, index) => {
        let val = values[index];
        if (val === undefined || val === '') {
          row[header] = null;
          emptyCells++;
        } else {
          // Strip leading/trailing quotes if they exist (handles malformed CSV)
          if (typeof val === 'string') {
            val = val.replace(/^"|"$/g, '').trim();
          }
          
          if (!isNaN(Number(val)) && val !== '') {
            row[header] = Number(val);
          } else {
            row[header] = val;
          }
        }
      });
      data.push(row);
    }
    
    steps.push("Data cleaning completed");

    return {
      steps,
      result: {
        meta: {
          rows: data.length,
          columns: headers.length,
          empty_cells_filled: emptyCells
        },
        headers,
        data,
      },
    };
  },
};
