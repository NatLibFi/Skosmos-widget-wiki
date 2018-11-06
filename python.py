# usage: use on unminified file, now hardcoded as "wikicss.css"
# will generate output.css (hardcoded)
# adds #wiki (hardcoded) in front of every rule path
# also, makes relative URLs absolute by prefixing them with
# (hardcoded) https://en.wikipedia.org/
#
# Afterwards, remember to add the LICENSE information!

def main():
    with open("output.css", "w+") as output:
        with open("wikicss.css", "r") as f:
            media = False
            block = False
            depth = 0

            for line in f:
                line = line.strip()
                length = len(line)

                if length > 0:
                    if line.startswith("@") or line.startswith("from {") or line.startswith("to {"):
                        media = True

                    if line[-1] == '{':
                        if not media:
                            output.write(depth * "    " + "#wiki " + line + '\n')
                            depth += 1
                            continue
                        else:
                            output.write(depth * "    " + line + "\n")
                            depth += 1
                            media = False
                            continue

                    elif line[-1] == '}':
                        depth -= 1
                        if depth < 0:
                            # TODO: find out why this tends to happen
                            depth = 0
                        output.write(depth * "    " + line + "\n")
                        continue

                    elif line[-1] == ',':
                        if media:
                            output.write(depth * "    " + line + "\n")
                        else:
                            output.write(depth * "    " + "#wiki " + line + '\n')
                    else:
                        if " url(" in line:
                            # TODO: enwiki to local wiki?
                            parts = line.split(" url(")
                            if len(parts) > 1:
                                if not parts[1].startswith(("//", "http", '"data:', "data:")):
                                    fixer = ""
                                    if parts[1][0] != "/":
                                        fixer = "/"
                                    line = parts[0] + " url(" + "https://en.wikipedia.org" + fixer + parts[1]
                        output.write(depth * "    " + line + '\n')


if __name__ == "__main__":
    main()



