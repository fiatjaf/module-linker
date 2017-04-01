import re
import fileinput


def clear(module):
    return re.sub('[^\w.]', '', module).strip()


opened = False
for line in fileinput.input():
    if re.search('exposed-modules', line.strip().lower()):
        opened = True
        m = line.strip().split(' ')[-1].strip()
        if m and not re.search('exposed', m.lower()):
            print(clear(m))
        continue
    if line.strip() == '' or re.search(':', line):
        opened = False
    if opened:
        print(clear(line))
        continue
