#! /bin/bash

python3 importUsers.py --i=/Users/dup4/Desktop/warmup_hznu_1.xlsx --o=/Users/dup4/Desktop/warmup_hznu_1.json --cid=11
python3 importUsers.py --i=/Users/dup4/Desktop/warmup_hznu_2.xlsx --o=/Users/dup4/Desktop/warmup_hznu_2.json --cid=11
python3 importUsers.py --i=/Users/dup4/Desktop/warmup_zucc.xlsx --o=/Users/dup4/Desktop/warmup_zucc.json --cid=11

python3 importUsers.py --i=/Users/dup4/Desktop/official_hznu_1.xlsx --o=/Users/dup4/Desktop/official_hznu_1.json --cid=12
python3 importUsers.py --i=/Users/dup4/Desktop/official_hznu_2.xlsx --o=/Users/dup4/Desktop/official_hznu_2.json --cid=13
python3 importUsers.py --i=/Users/dup4/Desktop/official_zucc.xlsx --o=/Users/dup4/Desktop/official_zucc.json --cid=12