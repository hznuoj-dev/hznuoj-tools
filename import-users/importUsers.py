import argparse
import openpyxl
import json
from os import path


def json_output(data):
    return json.dumps(data, sort_keys=False, indent=4, separators=(',', ':'), ensure_ascii=False)


def output(pathName, data):
    with open(pathName, 'w') as f:
        f.write(json_output(data))


def main():
    parser = argparse.ArgumentParser(description='Import Users.')
    parser.add_argument('--i', type=str, help='path of the input file.')
    parser.add_argument('--o', type=str, help='path of the output file.')
    parser.add_argument('--cid', type=int, help='contest id.')
    args = parser.parse_args()

    workbook = openpyxl.load_workbook(args.i)
    shenames = workbook.get_sheet_names()
    worksheet = workbook.get_sheet_by_name(shenames[0])

    res = {}

    res["contestId"] = int(args.cid)
    res["contestUserList"] = []

    headers = []
    i = 0

    for row in worksheet.rows:
        _row = []
        for cell in row:
            _row.append(cell.value)
        if i == 0:
            headers = _row
        else:
            item = {}
            for j in range(len(headers)):
                item[headers[j]] = _row[j]
            res["contestUserList"].append(item)

        i += 1

    output(args.o, res)


if __name__ == "__main__":
    main()
