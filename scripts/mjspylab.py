"""                        Generic data acquisition code.
                               ===  Library CODE  ===
      Author: MJS             Date: 2017-06-29                 Version: 0_0_5

This is written on top of the qtlab code and could not be done without it.
Much of the hard work has already been done, this just provides a nice
interface.

TODO:
 
 - plot colormaps.
 - 
 
HISTORY
2017-07-27 added readAuxrillaryLine functions
"""




from __future__ import print_function
import numpy as np
import os,math,json,codecs,datetime,qt,timetrack,sys,traces,shutil,itertools,time,platform,inspect,uuid,webbrowser,random
import dateutil.parser

header = """                            ===  QTLab + MJSpylab  ===
      Author: MJS 2017                                     Version: 0_0_5
      
"""
version = '0.0.5'
generator_string = 'qtlab, mjspylab.0.0.5'
schema_string = 'TUDelft.QuTech.Topo.MJS.0.0.5'
manifest_name = 'data_manifest.json'
#from builtins import input
#import pandas as pd


def readAuxrillary(file,*cols):
    #print('Reading file', file)
    with open(file, 'r') as f:
        last_line = f.read().splitlines()[-1]
    return dict(zip(cols, last_line.split('\t') ))
    
def readAuxrillaryLine(file):
    #print('Reading file', file)
    with open(file, 'r') as f:
        last_line = f.read().splitlines()[-1]
    return last_line
    


def _addOrBuild(l,i,e):
    if i >= len(l):
        l.extend(  [0]*  (i+1-len(l))    )
    l[i]=e
    
    
def _addToDictList(di,items,i,maxl):
    """di: dictonary of lists, items: dictions of new list items, i
    i: index, maxl: list length"""
    if items is not None:
        for s in items:
            if s not in di:
                #make it
                di[s] = []
            _addOrBuild(di[s],i,items[s])
            
def _equalLenghtTable(table,i):
    'make all arrays in the table dictionary at least as long as i'
    for k in table:
        if i >= len(table[k]):
            l.extend(  [0]*  (i+1-len(l)) )
    
def _getCoordinateSummary(coordinates):
    #make a coordinates summary dict
    coord_summary = {}
    for c in coordinates:
        name = c['name']
        val = c['range']
        coord_summary[ name ] = {}
        coord_summary[ name ]['min'] = np.min(val )
        coord_summary[ name ]['max'] = np.max( val )
        coord_summary[ name ]['size'] = np.size( val )
    return coord_summary

def _iso_datetime_string():
    return datetime.datetime.utcnow().isoformat()+'Z'


def aquireData(devices=None,
               coordinates=None,
               acqFunction=None, # inside the main loop
               resetFunction=None,
               setupFunction=None,
               data_folder = None,
               save_backwards_compatable_files = False,
               save_self_script = False,
               show_live_plot = False,
               attributes=None # the attributes and metadata.
               ):
    'measure using the user defined aquisition functions'
    
       
    if None in (devices, coordinates, acqFunction,resetFunction,
        setupFunction,data_folder,attributes):
        print('Something is not defined. We can not run the script')
        return {}
    
    
    file_name = _getTimeFileName()
    file_path = data_folder + file_name
    
    measurement = {'attr':attributes}
    #default_plot = attributes['default plot']
    
    attributes['_schema'] = schema_string 
    attributes['_version'] = version
    attributes['_platform'] = list(platform.uname())
    attributes['_uuid'] = str(uuid.uuid4())
    attributes['_generator'] = generator_string 
    attributes['_time start'] = _iso_datetime_string()
    attributes['_file name'] = file_name
    attributes['_file path'] = file_path
    
    attributes['_coordinates'] = _getCoordinateSummary(coordinates)
    
    _saveToManifest(measurement,data_folder)
    
    
    
    print(header)
    for n in attributes:
        print( n.rjust(14),':', attributes[n])
    
    
    start_time = time.time()
    mid_time = time.time()
    
    data = {}
    measurement['data'] = data
    
    
    
    coords = [e['range'] for e in coordinates]# [c['range'] for c in coordinates]
    coordnames =  [e['name'] for e in coordinates]#[c['name'] for c in coordinates]
    
    
    length=1
    for i in coords:
        length*=len(i)
    i=0
    
    lastcorddict = 'Not Set Up'
    
    print('Running startup function')
    attributes['_aux start'] = setupFunction()
    
    print('Getting starting device parameters')
    attributes['_devices start'] = _getAllDeviceSettings(devices)
    
    print('Starting Aquisition')
    
    update_delay = 5 #every 5 seconds ish or one loop. 
    update_last = time.time()
    has_opened_graph = False
    attributes['_completed'] = False
    attributes['_in progress'] = True
    lastresultsdict = None
    user_storage = {}
    try:
        for c in itertools.product(*coords):
        
            
            corddict = dict(zip(coordnames, c))
            
            
            if lastcorddict is 'Not Set Up':
                lastcorddict =  { k: float('nan') for k in corddict} # make a nan dict. 
            
            
            resultsdict = {}
            CONTINUE = acqFunction(corddict,resultsdict,lastcorddict,lastresultsdict,user_storage)
            if CONTINUE is False:
                break # we have been told to stop. so stop.
                
            
            lastresultsdict = resultsdict
            lastcorddict = corddict
            
            mid_time = time.time()
            
            #add coords to data
            _addToDictList(data, corddict ,i,length)
            _addToDictList(data, resultsdict ,i,length)
            _addToDictList(data, {'_time': round(mid_time-start_time,3)  } ,i,length)
            _equalLenghtTable(data,i)
            
            
            
            i+=1
            if mid_time - update_last > update_delay or i == length:
                update_last= mid_time
                remaining_time = datetime.timedelta( seconds = (length - i)*(mid_time - start_time) / i)
                end_time = datetime.datetime.now() + remaining_time
                if (show_live_plot) and (file_name is not None):
                    if not has_opened_graph:
                        webfile_name = 'file:///'+data_folder.replace('\\','/')+'viewer.html'
                        print('Showing graph:',webfile_name)
                        print('Saving to file:', file_path)
                        webbrowser.open(webfile_name)
                        has_opened_graph = True
                #updatestring = str(corddict)# + ' ' + str(resultsdict)
                print( '  '+str(math.floor(float(i)/length*100))+'%','  Time remaining: ' , str(remaining_time), ' eta: ', str(end_time)[:19], end='\r')
                attributes['_completion'] = math.floor( float(i) / length * 100)
                #save all as we go along.
                _saveMeasurement(measurement,file_path,fast=True)
                if save_backwards_compatable_files:
                    _saveBackwardsCompatableFiles(file_path,measurement)
            
    except KeyboardInterrupt:
        print('Stopping Aquisition Early')
    else:
        attributes['_completed'] = True # say we are done!
    finally:
        attributes['_in progress'] = False
    
    #_equalLenghtTable(data,i)
    
    print( '  100%','  Time remaining:  0:00:00.000000', ' eta: ', str(datetime.datetime.now())[:19] )
    print('Done Aquisition')
    attributes['_completion'] = math.ceil( float(i) / length * 100)
    total_time = datetime.timedelta( seconds = (mid_time - start_time) )
    print('Total Aquisition Time ', str(total_time))
    
    print('Running End Function')
    attributes['_aux end'] = resetFunction(measurement)
    
    print('Getting final device parameters')
    attributes['_devices end'] = _getAllDeviceSettings(devices)
    
    attributes['_time end'] = _iso_datetime_string()
    
    self_script = inspect.getsource(sys.modules['__main__'])
    attributes['_aquisition script'] = self_script
    
    if save_self_script:
        with open(file_path+'.py', 'w') as f:
            f.write( self_script )
        
    
    _saveMeasurement(measurement,file_path)
    return measurement
    
    
def _saveMeasurement(measurement,file_path,fast=False):
    if fast:
        json.dump(measurement, codecs.open(file_path, 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True)
    else:
        json.dump(measurement, codecs.open(file_path, 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True, indent=2)

    
def _build_empty_manifest(manifest_file):
    r = []
    _saveMeasurement(r,manifest_file)
    return r
    
def _get_manifest(manifest_file):
    if os.path.isfile(manifest_file):
        return json.loads(codecs.open(manifest_file, 'r', encoding='utf-8').read())
    else:
        return _build_empty_manifest(manifest_file)
        
def _saveToManifest(measurement,folder_path):
    # check if data_manifest.json exists.
    manifest_file = folder_path + manifest_name
    d = _get_manifest(manifest_file)
    
    #save more things?
    summary = {'filename':measurement['attr']['_file name']}
    
    
    d.append( summary )
    _saveMeasurement(d, manifest_file )
    
#loop through the devices.
def _getDeviceParameters(device):
    r = {}
    try:
        device.get_all()
    except:
        print('Device', device, 'is not updating parameters')
    try:
        p = device.get_parameters()
        r = {}
        for s in p:
            r[s] = p[s]['value']
    except:
        print('Device', device, 'is not giving parameters')
    
    return r

def _getAllDeviceSettings(devices):
    settings = {}
    for d in devices:
        print('Getting parameter for ', d)
        settings[d] = _getDeviceParameters( devices[d] )
    return settings

def _getTimeFileName():
    s= datetime.datetime.utcnow().isoformat()[:23]+'Z' 
    return s.replace('-','').replace(':','').replace('.','') + '.json'

def _mlog(s,quite):
    if not quite:
        print(s)
def _saveBackwardsCompatableFiles(file_path,d,quite=True):
    _mlog('save backwards files for compatability',quite)
    #df = pd.DataFrame(d['data'])
    shortFilepath = file_path[:-5]
    the_time = dateutil.parser.parse(d['attr']['_time start'])
    _mlog('Making a .set file',quite)
    s ='Filename: '+ shortFilepath.split('\\')[-1] + '\n'
    s += 'Timestamp: ' + the_time.strftime("%a %b %d %H:%M:%S %Y") + '\n\n'
    for device in d['attr']['_devices start']:
        s+= 'Instrument: ' + str(device) + ' \n'
        for setting in d['attr']['_devices start'][device]:
            s += '\t' + str(setting) + ': ' + str(d['attr']['_devices start'][device][setting]) +'\n'

    with open(shortFilepath+'.set', 'w') as f:
        f.write(s)
     
    
    _mlog('Making a .dat file',quite)
    s  ='# Filename: '+ shortFilepath.split('\\')[-1]+'.dat' + '\n'
    s += '# Timestamp: ' +  the_time.strftime("%a %b %d %H:%M:%S %Y") + '\n\n'
    i=1; #keep track of column numbers
    keys = []
    for k in d['attr']['_coordinates']:
        keys.append(k)
        s += '# Column ' + str(i) +":\n"
        s+= '#\tend: '+str(d['attr']['_coordinates'][k]['max']) + '\n'
        s+= '#\tname: '+ str(k) + '\n'
        s+= '#\tsize: '+ str(d['attr']['_coordinates'][k]['size']) + '\n'
        s+= '#\tstart: '+ str(d['attr']['_coordinates'][k]['min']) + '\n'
        s += '#\ttype: coordinate\n'
        i+=1
        
    for col in d['data']:
        if col not in d['attr']['_coordinates']:
            keys.append(col)
            s += '# Column ' + str(i) +":\n"
            s += '#\tname: ' + str( col ) +"\n"
            s += '#\ttype: value\n'
            i += 1
    
    s+= '\n'
    #try to remove this line
    #s += df.to_csv(sep='\t' ,columns = keys, index=False, header=False)
    maxl = len(d['data'][keys[0]])
    l=0
    linetext = []
    while l < maxl:
        for j in range(len(keys)):
            linetext.append (  str( d['data'][keys[j]][l] ) )
        s += '\t'.join(linetext) + '\n'
        linetext = []
        l+=1
    
    with open(shortFilepath+'.dat', 'w') as f:
        f.write(s)
        
    _mlog('Making a .meta.txt file',quite)
    s = ''
    i=0
    if '_coordinates' in d['attr']:
        for k in d['attr']['_coordinates']:
            s+= str(d['attr']['_coordinates'][k]['size']) + '\n'
            s+= str(d['attr']['_coordinates'][k]['min']) + '\n'
            s+= str(d['attr']['_coordinates'][k]['max']) + '\n'
            s+= str(k) + '\n'
            i+=1
        for col in d['data']:
            if col not in d['attr']['_coordinates']:
                # it is a value not a coordinates
                i+=1
                s+= str(i) + '\n'
                s+= str(col)+ '\n'
    with open(shortFilepath+'.meta.txt', 'w') as f:
        f.write(s)
