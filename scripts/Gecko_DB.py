import numpy as np
import mjspylab,math,json,codecs,datetime,qt,sys,time
reload(mjspylab) #testing only
#make a dictionary of all the devices used.
devices = {'keithley1': qt.instruments.get('keithley1'),
           'keithley2': qt.instruments.get('keithley2'),
           'ivvi': qt.instruments.get('ivvi'),
           # 'lockin1': qt.instruments.get('lockin1'),
           # 'lockin2': qt.instruments.get('lockin2'),
           # 'magnet': qt.instruments.get('magnet'),
}
description = """TC measurement on ~115nm NbTiN film. 
              HNO3 clean (6min, US4), O2 clean (600W,200sccm,10min), 
              NbTiN sputter (5.5min, 250W, Ar=50sccm, N=3.5sccm, P=2.5mTorr""" # how
attributes = {'sample': 'sample sim', # the sample number
        'title':'resistance measurement', # a title for this data set, what
        'subtitle':'', # extra bit of infomation, why
        'series':'YD', # a series of measurements as part of a group. context
        'tags':['TC','YD','NbTiN','Yale','Andreev','Qubit'], #keywords for searching for files later , gate_sweep iv_sweep
        'author':'DB',
        'copyright' :  'internal - not for public release',
        'fridge':'Gecko', # What fridge it is being measured in
        'description':description,
        'fabricator':'DB', # people who made it
        'operator' : 'DB', # people measuring it
        'device' : '',
        'connection lines': [9,10,11,12],
        'comments' : '',
        # save other data that is relivant for you! connection lines? orientation? 
        }

# Data storage
data_folder = 'D:\\mjspylab-master\\data\\'
shared_folder = 'K:\\ns\\qt\\qt-shared\\sarsby\\web\\data\\'+attributes['series']+'\\'

# Save the state of the ivvi rack. Unfotunatally you have to enter this all by hand.
attributes['ivvi rack'] = {'Dac 1 output current gain A/V' : 100e-6,
                    'Voltage input gain V/V': 1000,
                    }

# Coordinates
coordinatesArray=[
            {'name':'Repeats','range':range(1)},
            {'name':'bias dac / mV','range':np.linspace(-1000,1000,100)},
            ]
             
             
def setupFunction():
    devices['ivvi'].set_parameter_rate('dac1',50,10) # maxstep, delay
    # devices['ivvi'].set_parameter_rate('dac5',1,50) # maxstep, delay
    # devices['ivvi'].set_parameter_rate('dac6',1,50) # maxstep, delay
       
    #devices['ivvi'].set_dacs_zero()
    devices['keithley1'].set_averaging(False)
    devices['keithley1'].set_averaging_type('Repeating')
    devices['keithley1'].set_averaging_count(1)
    devices['keithley1'].set_integration_time(1)

    
    print('waiting for start')
    time.sleep(0.01) # seconds
    
    return {'Keithley1 offset / V':devices['keithley1'].get_readnextval(),}

def acqFunction(coordinates,results,prev_coordinates,prev_result,user_storage):  

    # Repeats
    if prev_coordinates['Repeats'] != coordinates['Repeats']:
        time.sleep(1) # seconds
        
    # Bias dac
    if prev_coordinates['bias dac / mV'] != coordinates['bias dac / mV']:
        devices['ivvi'].set_dac1(coordinates['bias dac / mV'])    
        # time.sleep(10) # seconds

    # End of sweep
    time.sleep(0.01) # seconds    

    # Datetime
    results['Datetime'] = datetime.datetime.utcnow().isoformat()+'Z'

    # Keithleys 
    results['keithley1 / V'] = devices['keithley1'].get_readnextval()

    # some on-the-fly analysis
    results['DC Current / A'] = coordinates['bias dac / mV'] * attributes['ivvi rack']['Dac 1 output current gain A/V'] * 1e-3
    results['DC Voltage / V'] = results['keithley1 / V'] / attributes['ivvi rack']['Voltage input gain V/V']
 
    try:
        results['DC Resistance / Ohms'] = results['DC Voltage / V']/results['DC Current / A']
    except:
        results['DC Resistance / Ohms'] = 0

    return True 

def resetFunction(results):
    devices['ivvi'].set_dacs_zero()
    return {

    }

#returns a dictionary that is the same as the saved JSON
result = mjspylab.aquireData(devices=devices,
                  coordinatesArray=coordinatesArray,
                  acqFunction=acqFunction, # inside the main loop
                  resetFunction=resetFunction,
                  setupFunction=setupFunction,
                  data_folder = data_folder,
                  shared_folder = shared_folder,
                  save_backwards_compatable_files = True,
                  save_self_script = True,
                  show_live_plot = False,
                  attributes=attributes # the attributes and metadata.
                )

