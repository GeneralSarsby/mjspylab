import os 

os.system('python D:/microkelvin/Run2/scripts/mjsDummyObject.py')

blankJobDict = {
        daemonRunning  : False,
        lock : False,
        jobs_pending : [],
        jobs_done : [],
        current_job = None,

}

def _build_empty_manifest(manifest_file):
    r = []
    _saveDict(r,manifest_file)
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
    _saveDict(d, manifest_file )
    
def _saveDict(measurement,file_path,fast=False):
    if fast:
        json.dump(measurement, codecs.open(file_path, 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True)
    else:
        json.dump(measurement, codecs.open(file_path, 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True, indent=2)

        
        
# a dict of options to pick from
options = {'quit':quit_function,
			'q':quit_function,
			'clear':clear_logs,
			'c':clear_logs,
			'wait':new_cycle_time,
			'w':new_cycle_time,
			'help':help_function,
			'h':help_function}

            
#main loop

doLooping = True
while doLooping:
	try:
		while True:
			aquireAndSave()
			time.sleep(period)
	except KeyboardInterrupt:
		user_input_handler()
	#except:
	#	print 'Something else screwed up, trying again'
	#		time.sleep(1)
print 'Done'

