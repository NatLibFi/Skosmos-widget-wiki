#!/usr/bin/env python

# program for prepending CSS selectors with an arbitrary selector
# also, makes relative URLs absolute by prefixing them with
# (hardcoded) https://en.wikipedia.org/
#
# Afterwards, remember to check/add the LICENSE information!

import argparse
from pathlib import Path

def readCommandLineArguments():
    parser = argparse.ArgumentParser(description="Very simplistic program for prepending unminified CSS file selectors with an arbitrary selector.")
    parser.add_argument("-i", "--input",
        help="Unminified input file.", required=True)
    parser.add_argument("-o", "--output",
        help="Prepended output file.", required=True)
    parser.add_argument("-p", "--prepend-with",
        help="The selector to be used in prepending.", required=True)
    parser.add_argument("-org","--organization",
        help="The organization that provided the original file.")
    parser.add_argument("-f", "--file-location",
        help="The original file location / where was it taken from.")
    parser.add_argument("-l", "--license",
        help="License for the original file.")

    args = parser.parse_args()
    return args


def main():
    args = readCommandLineArguments()

    prepending_selector = args.prepend_with

    if prepending_selector[-1] != " ":
        prepending_selector += " "

    with open(args.output, "w+") as output:
        with open(args.input, "r") as f:
            media = False
            depth = 0

            organization = args.organization.strip() + " " if args.organization and len(args.organization.strip()) > 0 else ""
            file_location = args.file_location.strip() + " " if args.file_location and len(args.file_location.strip()) > 0 else ""

            output.write("/* Modified " + organization + \
                "stylesheet file for Skosmos wiki widget. Original file " + \
                file_location + "distributed under the following license:\n\n")

            if args.license:
                if Path(args.license).exists():
                    output.write(Path(args.license).read_text())
                else:
                    output.write(args.license)

            output.write("*/\n\n")

            for line in f:
                # TODO: support for comments/use proper parser
                line = line.strip()
                length = len(line)

                if length > 0:
                    if line.startswith("@") or line.startswith("from {") or line.startswith("to {"):
                        media = True

                    if line[-1] == '{':
                        if not media:
                            output.write(depth * "    " + prepending_selector + line + '\n')
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
                            output.write(depth * "    " + prepending_selector + line + '\n')
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
                else:
                    output.write(depth * "    " + line + '\n')


if __name__ == "__main__":
    main()


