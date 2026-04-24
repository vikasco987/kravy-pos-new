import sys

file_path = '/Users/vikas/Desktop/kravy-pos-website/src/app/dashboard/billing/checkout/CheckoutClient.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Target area: lines 1472 to 1478 (0-indexed: 1471 to 1477)
# We want to remove the garbage that starts with ₹{addon.price}
garbage_pattern = '₹{addon.price}'

new_lines = []
skip = False
for i, line in enumerate(lines):
    if 1460 < i < 1485 and garbage_pattern in line:
        # Found the garbage block
        skip = True
        continue
    
    if skip:
        # Check if we are past the garbage
        if '</div>' in line and i > 1475:
             # Stop skipping after the garbage divs
             # Actually, let's just use line numbers since we just viewed them
             pass
        
        # Simpler: just skip from 1472 to 1478 (0-indexed 1471 to 1477)
        if 1471 <= i <= 1477:
            continue
        else:
            skip = False
            new_lines.append(line)
    else:
        new_lines.append(line)

# Let's double check the lines we are removing
# 1471:                            ))}
# 1472:                    <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 tracking-tighter">₹{addon.price}</span>
# 1473:                                        </div>
# 1474:                                      </button>
# 1475:                                   ))}
# 1476:                                </div>
# 1477:                              </div>
# 1478:                            ))}

# Actually, 1471 is correct (closes the map), but 1472-1478 is extra.

with open(file_path, 'w') as f:
    # Manual surgical strike
    final_lines = lines[:1471] + lines[1478:]
    f.writelines(final_lines)

print("Successfully cleaned up the addon garbage.")
