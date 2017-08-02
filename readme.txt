                       
                             MJS-PY-LAB Data Aquision Aid. 
                                 ===  Read Me  ===
Author: MJS  Date: 2017-07-31 Readme Version: 0.0.4  MJS-PY-LAB version : 0.0.4

This is written on top of the qtlab code and could not be done without it.
Much of the hard work has already been done, this just provides a nice
interface to make writing data aquision scripts easy.

=== Features
 - rich metadata, for use with...
 - structured json data output, and backwards compatable output (.dat .set .meta.dat .js)
 - json explorer, viewer and plotting (json is also just plain-text)
 - easy n-dimension looping
 - simple coordinate definitions
 - live plotting, also via the backwards compatability mode
 - short, easy to understand scripts often under 50 lines (which are mostly just comments)
 
 
=== Quick start up guide
Copy the folder mjspylab into a working directory on
disk. e.g. D:/yourname/experiments/run_number/mjspylab/
Edit the file example_script.py and save it to be something name some useful
to you e.g. mjspylab/scripts/field_bias_sweep.py .
Read an follow the directions in the file when setting up devices.
Write the startup function, mainloop, and ending function inside your new script.

Check the C:\qtlab-master\init scripts as usual.
Then launch QTlab as usual.

in the QTlab console, use
run D:/path/to/your/script/yourscript.py


 
 
 
 
 
 
 
 
 
Upcoming features:
 - Job queue and queue management
 - data libary viewing (iTunes like, using the metadata)
 - aquision robots, inc. optimisers, PIDs, peaks finders, trackers, explorers.
 
 