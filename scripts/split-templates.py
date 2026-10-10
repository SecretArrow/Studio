#!/usr/bin/env python3
"""Split template-builder.ts: move TPLS array -> templates/core.ts, keep helpers + TemplateSpec."""
import re, os

SRC = "/home/z/my-project/src/lib/design/template-builder.ts"
CORE = "/home/z/my-project/src/lib/design/templates/core.ts"

with open(SRC) as f:
    lines = f.readlines()

# locate markers
start_lib = next(i for i, l in enumerate(lines) if "template library" in l and l.startswith("/*"))
line_tpls = next(i for i, l in enumerate(lines) if l.startswith("export const TPLS: TemplateSpec[]"))
line_iface = next(i for i, l in enumerate(lines) if l.startswith("export interface TemplateSpec"))
line_v = next(i for i, l in enumerate(lines) if l.startswith('const V = "#7c3aed"'))
# end of TPLS array: the standalone "]"
end_tpls = next(i for i, l in enumerate(lines) if i > line_tpls and l.rstrip() == "]")

# seed helpers section (TPL_CATEGORY_IDS .. end)
line_seed_helpers = next(i for i, l in enumerate(lines) if "seed-facing helpers" in l)

iface_block = lines[line_iface:line_v]  # interface + trailing comment
body = lines[line_v:end_tpls + 1]        # const V ... ]
seed_helpers = lines[line_seed_helpers:]

# --- new core.ts ---
core_header = '''/**
 * Core template library — the original 44 hand-crafted templates.
 * All templates are REAL editable DesignDocs composed via template-builder helpers.
 */
import {
  asset,
  chart,
  doc,
  ellipse,
  F,
  gradient,
  grid,
  hstack,
  img,
  note,
  page,
  pill,
  qrEl,
  rect,
  rule,
  shp,
  solid,
  tbl,
  txt,
  vstack,
  type TemplateSpec,
} from "../template-builder"
import type { DesignElement } from "../types"

'''

# rename TPLS -> CORE_TPLS in body
body_txt = "".join(body).replace("export const TPLS: TemplateSpec[]", "export const CORE_TPLS: TemplateSpec[]")
# de-indent not needed; keep as-is
os.makedirs(os.path.dirname(CORE), exist_ok=True)
with open(CORE, "w") as f:
    f.write(core_header + body_txt)

# --- trim template-builder.ts: keep everything before template-library marker, + iface, then drop TPLS body & seed helpers ---
new_main = lines[:start_lib] + iface_block + ['\nexport const V = "#7c3aed"\n']
with open(SRC, "w") as f:
    f.writelines(new_main)

print("core.ts lines:", len(core_header.splitlines()) + len(body))
print("template-builder.ts trimmed to:", len(new_main))
